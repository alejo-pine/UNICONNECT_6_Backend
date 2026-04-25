import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';
import { PublicProfile } from '../../domain/entities/profile';

export class GetPublicProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(id: string): Promise<ServiceResult<PublicProfile>> {
    try {
      const data = await this.profileRepository.findPublicById(id);
      if (!data) {
        return { data: null, error: 'Profile not found', statusCode: 404 };
      }

      const publicProfile: PublicProfile = {
        full_name: data.name,
        career: data.career,
        semester: data.semester,
        phone_number: data.phone_number,
        avatar_url: data.avatar_url,
        subjects: (data.profile_subject ?? [])
          .flatMap((ps) => ps.subject ?? [])
          .map((subject) => subject.name)
          .filter((name): name is string => typeof name === 'string'),
      };

      return { data: publicProfile, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching public profile';
      eventLogger.error('GetPublicProfileUseCase.execute', message, { id });
      return { data: null, error: 'Error fetching public profile', statusCode: 500 };
    }
  }
}
