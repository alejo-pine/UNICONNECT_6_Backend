import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupDetailResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';

export class GetStudyGroupDetailUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(groupId: string): Promise<ServiceResult<StudyGroupDetailResponse>> {
    try {
      if (!groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findDetailById(groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      return {
        data: group,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('GetStudyGroupDetailUseCase.execute', message, { groupId });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      return {
        data: null,
        error: 'Failed to fetch study group detail',
        statusCode: 500,
      };
    }
  }
}
