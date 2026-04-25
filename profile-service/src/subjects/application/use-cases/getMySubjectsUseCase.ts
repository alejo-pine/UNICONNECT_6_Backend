import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { SubjectSummary } from '../../domain/entities/subject';
import { SubjectReadRepositoryPort } from '../../domain/ports/subjectReadRepositoryPort';

export class GetMySubjectsUseCase {
  constructor(private readonly subjectRepository: SubjectReadRepositoryPort) {}

  async execute(profileId: string): Promise<ServiceResult<SubjectSummary[]>> {
    try {
      if (!profileId || typeof profileId !== 'string' || !profileId.trim()) {
        return {
          data: null,
          error: 'Profile ID is required and must be a non-empty string',
          statusCode: 400,
        };
      }

      const data = await this.subjectRepository.findByProfileId(profileId);
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching enrolled subjects';
      eventLogger.error('GetMySubjectsUseCase.execute', message, { profileId });
      return { data: null, error: 'Error fetching enrolled subjects', statusCode: 500 };
    }
  }
}
