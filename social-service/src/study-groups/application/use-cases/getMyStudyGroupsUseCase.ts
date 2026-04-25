import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export class GetMyStudyGroupsUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(profileId: string): Promise<ServiceResult<StudyGroupResponse[]>> {
    try {
      const groups = await this.studyGroupRepository.findByProfileId(profileId);

      return {
        data: groups.map((group) => ({
          ...group,
          isAdmin: group.creatorId === profileId,
          isMember: true,
        })),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch study groups';
      eventLogger.error('GetMyStudyGroupsUseCase.execute', message, { profileId });

      return {
        data: null,
        error: 'Failed to fetch study groups',
        statusCode: 500,
      };
    }
  }
}
