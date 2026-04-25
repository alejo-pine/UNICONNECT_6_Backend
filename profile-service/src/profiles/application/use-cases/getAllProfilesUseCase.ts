import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { Profile } from '../../domain/entities/profile';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';

export class GetAllProfilesUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(): Promise<ServiceResult<Profile[]>> {
    try {
      const data = await this.profileRepository.findAll();
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching profiles';
      eventLogger.error('GetAllProfilesUseCase.execute', message);
      return { data: null, error: 'Error fetching profiles', statusCode: 500 };
    }
  }
}
