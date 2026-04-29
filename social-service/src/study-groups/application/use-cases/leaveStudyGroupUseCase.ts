import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export interface LeaveStudyGroupCommand {
  groupId: string;
  profileId: string;
}

export class LeaveStudyGroupUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(command: LeaveStudyGroupCommand): Promise<ServiceResult<StudyGroupResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      const isMember = await this.studyGroupRepository.isMember(command.profileId, command.groupId);
      if (!isMember) {
        throw new HttpError(404, 'You are not a member of this group');
      }

      // Block any leave operation while an admin transfer is pending.
      const pendingTransfer = await this.studyGroupRepository.getPendingAdminTransfer(command.groupId);
      if (pendingTransfer && pendingTransfer.status === 'pending') {
        throw new HttpError(
          409,
          'Debes completar la transferencia de administración antes de salir'
        );
      }

      if (group.creatorId === command.profileId) {
        const detail = await this.studyGroupRepository.findDetailById(command.groupId);
        if (!detail) {
          throw new HttpError(404, 'Study group not found');
        }

        const otherMembers = detail.members.filter((memberId) => memberId !== command.profileId);
        if (otherMembers.length > 0) {
          throw new HttpError(
            409,
            'Admin must transfer group administration before leaving while other members exist'
          );
        }
      }

      await this.studyGroupRepository.removeMember(command.profileId, command.groupId);

      eventLogger.info('LeaveStudyGroupUseCase.execute', 'User left study group', {
        groupId: command.groupId,
        profileId: command.profileId,
      });
      // Hook point for domain events (e.g., notify clients asynchronously).

      return {
        data: {
          ...group,
          isAdmin: false,
          isMember: false,
        },
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('LeaveStudyGroupUseCase.execute', message, {
        groupId: command.groupId,
        profileId: command.profileId,
      });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      return {
        data: null,
        error: 'Failed to leave study group',
        statusCode: 500,
      };
    }
  }
}
