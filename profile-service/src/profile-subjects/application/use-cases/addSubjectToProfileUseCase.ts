import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ProfileSubjectRelation } from '../../domain/entities/profileSubject';
import { ProfileSubjectsRepositoryPort } from '../../domain/ports/profileSubjectsRepositoryPort';

const mapErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export class AddSubjectToProfileUseCase {
  constructor(private readonly repository: ProfileSubjectsRepositoryPort) {}

  async execute(profileId: string, subjectId: string): Promise<ServiceResult<ProfileSubjectRelation>> {
    try {
      const data = await this.repository.addSubjectToProfile(profileId, subjectId);
      return { data, error: null, statusCode: 201 };
    } catch (err: unknown) {
      const message = mapErrorMessage(err, 'Error adding subject to profile');
      eventLogger.error('AddSubjectToProfileUseCase.execute', message, { profileId, subjectId });
      return {
        data: null,
        error: message,
        statusCode: 500,
      };
    }
  }
}
