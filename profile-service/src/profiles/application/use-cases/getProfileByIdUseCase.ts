import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';
import { BaseProfileComponent, ProfileWithStatistics, ProfileWithBadges, IProfileComponent } from '../../domain/entities/profileDecorator';

export class GetProfileByIdUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(id: string, vista?: string): Promise<ServiceResult<any>> {
    try {
      const data = await this.profileRepository.findById(id);
      if (!data) {
        return { data: null, error: 'Profile not found', statusCode: 404 };
      }

      // Merge with public profile data to include active subjects for Base Profile
      const publicData = await this.profileRepository.findPublicById(id);
      const subjects = (publicData?.profile_subject ?? [])
        .flatMap((ps) => ps.subject ?? [])
        .map((subject) => subject.name)
        .filter((name): name is string => typeof name === 'string');

      const baseProfileData = {
        ...data,
        subjects
      };

      let profileComponent: IProfileComponent = new BaseProfileComponent(baseProfileData);

      if (vista === 'completa') {
        const stats = await this.profileRepository.getProfileStatistics(id);
        profileComponent = new ProfileWithStatistics(profileComponent, stats);

        const badges = await this.profileRepository.getProfileBadges(id);
        profileComponent = new ProfileWithBadges(profileComponent, badges);
      }

      return { data: profileComponent.getProfileData(), error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching profile';
      eventLogger.error('GetProfileByIdUseCase.execute', message, { id });
      return { data: null, error: 'Error fetching profile', statusCode: 500 };
    }
  }
}
