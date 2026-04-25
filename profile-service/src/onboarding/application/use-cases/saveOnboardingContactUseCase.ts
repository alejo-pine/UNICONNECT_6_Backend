import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingRepositoryPort, OnboardingStepOneRecord } from '../../domain/ports/onboardingRepositoryPort';
import { OnboardingContactInput, OnboardingStepOneData } from '../../domain/entities/onboarding';

const toOnboardingStepOneData = (record: OnboardingStepOneRecord): OnboardingStepOneData => ({
  profileId: record.profile_id,
  career: record.career,
  semester: record.semester,
  phoneNumber: record.phone_number,
});

export class SaveOnboardingContactUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(
    profileId: string,
    input: OnboardingContactInput
  ): Promise<ServiceResult<OnboardingStepOneData>> {
    try {
      const record = await this.onboardingRepository.saveOnboardingContactForProfile(profileId, input);

      if (!record) {
        return {
          data: null,
          error: 'Profile not found',
          statusCode: 404,
        };
      }

      return {
        data: toOnboardingStepOneData(record),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving onboarding contact';
      eventLogger.error('SaveOnboardingContactUseCase.execute', message, { profileId });
      return {
        data: null,
        error: 'Error saving onboarding contact',
        statusCode: 500,
      };
    }
  }
}
