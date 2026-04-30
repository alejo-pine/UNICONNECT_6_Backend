import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { studyGroupRealtimeBus } from '../../../realtime/studyGroupRealtime';
import { StudyGroupDetailResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export interface AcceptStudyGroupRequestCommand {
  groupId: string;
  currentUserId: string;
  requestedUserId: string;
}

export class AcceptStudyGroupRequestUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(
    command: AcceptStudyGroupRequestCommand
  ): Promise<ServiceResult<StudyGroupDetailResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      if (!command.requestedUserId.trim()) {
        throw new HttpError(400, 'Field "userId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      if (group.createdBy !== command.currentUserId) {
        throw new HttpError(403, 'Forbidden: only admin can accept requests');
      }

      const userExists = await this.studyGroupRepository.userExists(command.requestedUserId);
      if (!userExists) {
        throw new HttpError(404, 'User not found');
      }

      const hasPendingRequest = await this.studyGroupRepository.hasPendingRequest(
        command.requestedUserId,
        command.groupId
      );

      if (!hasPendingRequest) {
        throw new HttpError(409, 'Request already processed or does not exist');
      }

      const alreadyMember = await this.studyGroupRepository.isMember(
        command.requestedUserId,
        command.groupId
      );

      if (alreadyMember) {
        throw new HttpError(409, 'User is already a member of this group');
      }

      await this.studyGroupRepository.addMember(command.requestedUserId, command.groupId);

      try {
        await this.studyGroupRepository.removePendingRequest(command.requestedUserId, command.groupId);
      } catch (removeErr: unknown) {
        await this.studyGroupRepository.removeMember(command.requestedUserId, command.groupId);
        throw removeErr;
      }

      eventLogger.info('AcceptStudyGroupRequestUseCase.execute', 'Request accepted', {
        groupId: command.groupId,
        requestedUserId: command.requestedUserId,
        adminUserId: command.currentUserId,
      });

      const updatedGroup = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!updatedGroup) {
        throw new HttpError(404, 'Study group not found');
      }

      studyGroupRealtimeBus.publishStudyGroupUpdated({
        groupId: command.groupId,
        action: 'request_accepted',
        requestedUserId: command.requestedUserId,
        actorUserId: command.currentUserId,
        updatedGroup,
        timestamp: new Date().toISOString(),
      });

      return {
        data: updatedGroup,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('AcceptStudyGroupRequestUseCase.execute', message, {
        groupId: command.groupId,
        requestedUserId: command.requestedUserId,
        currentUserId: command.currentUserId,
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
        error: 'Failed to accept group request',
        statusCode: 500,
      };
    }
  }
}
