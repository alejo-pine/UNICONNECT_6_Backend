import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { Subject } from '../../domain/entities/profileSubject';
import { ProfileSubjectsRepositoryPort } from '../../domain/ports/profileSubjectsRepositoryPort';

const mapErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export class GetSubjectsInfoByProfileUseCase {
  constructor(private readonly repository: ProfileSubjectsRepositoryPort) {}

  async execute(profileId: string): Promise<ServiceResult<Subject[]>> {
    try {
      const subjects = await this.repository.findSubjectsInfoByProfile(profileId);
      return { data: subjects, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = mapErrorMessage(err, 'Error fetching full subject info by profile');
      eventLogger.error('GetSubjectsInfoByProfileUseCase.execute', message, { profileId });
      return {
        data: null,
        error: message,
        statusCode: 500,
      };
    }
  }
}
