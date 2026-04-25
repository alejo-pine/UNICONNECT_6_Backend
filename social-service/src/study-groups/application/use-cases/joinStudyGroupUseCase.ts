import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export interface JoinStudyGroupCommand {
  groupId: string;
  profileId: string;
}

export class JoinStudyGroupUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(command: JoinStudyGroupCommand): Promise<ServiceResult<StudyGroupResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      const isEnrolled = await this.studyGroupRepository.verifyEnrollment(
        command.profileId,
        group.subjectId
      );

      if (!isEnrolled) {
        throw new HttpError(403, 'Forbidden: You are not enrolled in the subject for this group');
      }

      await this.studyGroupRepository.addMember(command.profileId, command.groupId);

      return {
        data: {
          ...group,
          isAdmin: group.creatorId === command.profileId,
          isMember: true,
        },
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('JoinStudyGroupUseCase.execute', message, {
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
        error: 'Failed to join study group',
        statusCode: 500,
      };
    }
  }
}
