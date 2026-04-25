import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ProfileSubjectsRepositoryPort } from '../../domain/ports/profileSubjectsRepositoryPort';

const mapErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export class RemoveSubjectFromProfileUseCase {
  constructor(private readonly repository: ProfileSubjectsRepositoryPort) {}

  async execute(profileId: string, subjectId: string): Promise<ServiceResult<boolean>> {
    try {
      await this.repository.removeSubjectFromProfile(profileId, subjectId);
      return { data: true, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = mapErrorMessage(err, 'Error removing subject from profile');
      eventLogger.error('RemoveSubjectFromProfileUseCase.execute', message, { profileId, subjectId });
      return {
        data: null,
        error: message,
        statusCode: 500,
      };
    }
  }
}
