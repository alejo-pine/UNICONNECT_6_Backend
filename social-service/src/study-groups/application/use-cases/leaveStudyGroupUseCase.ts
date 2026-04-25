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

      if (group.creatorId === command.profileId) {
        throw new HttpError(403, 'Group creator cannot leave the group');
      }

      const isMember = await this.studyGroupRepository.isMember(command.profileId, command.groupId);
      if (!isMember) {
        throw new HttpError(404, 'You are not a member of this group');
      }

      await this.studyGroupRepository.removeMember(command.profileId, command.groupId);

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
