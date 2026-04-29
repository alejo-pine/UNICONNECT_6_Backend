import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupDetailResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export interface TransferStudyGroupAdminCommand {
  groupId: string;
  currentUserId: string;
  newAdminUserId: string;
}

export class TransferStudyGroupAdminUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(
    command: TransferStudyGroupAdminCommand
  ): Promise<ServiceResult<StudyGroupDetailResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      if (!command.newAdminUserId.trim()) {
        throw new HttpError(400, 'Field "newAdminUserId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      if (group.createdBy !== command.currentUserId) {
        throw new HttpError(403, 'Forbidden: only admin can transfer administration');
      }

      if (group.createdBy === command.newAdminUserId) {
        throw new HttpError(409, 'User is already the group admin');
      }

      const userExists = await this.studyGroupRepository.userExists(command.newAdminUserId);
      if (!userExists) {
        throw new HttpError(404, 'User not found');
      }

      const isMember = await this.studyGroupRepository.isMember(command.newAdminUserId, command.groupId);
      if (!isMember) {
        throw new HttpError(404, 'User is not a member of this group');
      }

      await this.studyGroupRepository.transferAdmin(command.groupId, command.newAdminUserId);

      eventLogger.info('TransferStudyGroupAdminUseCase.execute', 'Admin transferred', {
        groupId: command.groupId,
        previousAdminUserId: command.currentUserId,
        newAdminUserId: command.newAdminUserId,
      });
      // Hook point for domain events (e.g., notify clients asynchronously).

      const updatedGroup = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!updatedGroup) {
        throw new HttpError(404, 'Study group not found');
      }

      return {
        data: updatedGroup,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('TransferStudyGroupAdminUseCase.execute', message, {
        groupId: command.groupId,
        currentUserId: command.currentUserId,
        newAdminUserId: command.newAdminUserId,
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
        error: 'Failed to transfer group admin',
        statusCode: 500,
      };
    }
  }
}
