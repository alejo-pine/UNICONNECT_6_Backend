import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export class GetAvailableStudyGroupsBySubjectUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(
    subjectId: string,
    currentProfileId: string
  ): Promise<ServiceResult<StudyGroupResponse[]>> {
    try {
      const isEnrolled = await this.studyGroupRepository.verifyEnrollment(currentProfileId, subjectId);

      if (!isEnrolled) {
        return {
          data: null,
          error: 'Forbidden: You are not enrolled in this subject',
          statusCode: 403,
        };
      }

      const groups = await this.studyGroupRepository.findAvailableBySubject(
        subjectId,
        currentProfileId
      );

      const myGroups = await this.studyGroupRepository.findByProfileId(currentProfileId);
      const myGroupIds = new Set(myGroups.map((group) => group.id));

      return {
        data: groups.map((group) => ({
          ...group,
          isAdmin: false,
          isMember: myGroupIds.has(group.id),
        })),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch available study groups';
      eventLogger.error('GetAvailableStudyGroupsBySubjectUseCase.execute', message, {
        subjectId,
        currentProfileId,
      });

      return {
        data: null,
        error: 'Failed to fetch available study groups for subject',
        statusCode: 500,
      };
    }
  }
}
