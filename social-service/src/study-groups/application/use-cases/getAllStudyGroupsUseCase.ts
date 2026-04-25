import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export class GetAllStudyGroupsUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(limit: number): Promise<ServiceResult<StudyGroupResponse[]>> {
    try {
      const groups = await this.studyGroupRepository.findAll(limit);

      return {
        data: groups.map((group) => ({
          ...group,
          isAdmin: false,
          isMember: false,
        })),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch study groups';
      eventLogger.error('GetAllStudyGroupsUseCase.execute', message, { limit });

      return {
        data: null,
        error: 'Failed to fetch study groups',
        statusCode: 500,
      };
    }
  }
}
