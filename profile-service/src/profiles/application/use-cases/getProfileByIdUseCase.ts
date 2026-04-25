import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { Profile } from '../../domain/entities/profile';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';

export class GetProfileByIdUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(id: string): Promise<ServiceResult<Profile>> {
    try {
      const data = await this.profileRepository.findById(id);
      if (!data) {
        return { data: null, error: 'Profile not found', statusCode: 404 };
      }
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching profile';
      eventLogger.error('GetProfileByIdUseCase.execute', message, { id });
      return { data: null, error: 'Error fetching profile', statusCode: 500 };
    }
  }
}
