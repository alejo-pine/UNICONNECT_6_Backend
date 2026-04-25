import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingRepositoryPort, OnboardingStepOneRecord } from '../../domain/ports/onboardingRepositoryPort';
import { OnboardingStepOneData, OnboardingStepOneInput } from '../../domain/entities/onboarding';

const toOnboardingStepOneData = (record: OnboardingStepOneRecord): OnboardingStepOneData => ({
  profileId: record.profile_id,
  career: record.career,
  semester: record.semester,
  phoneNumber: record.phone_number,
});

export class SaveOnboardingStepOneUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(
    profileId: string,
    input: OnboardingStepOneInput
  ): Promise<ServiceResult<OnboardingStepOneData>> {
    try {
      console.log('[SaveOnboardingStepOneUseCase] Iniciando...', { profileId, input });
      
      const record = await this.onboardingRepository.saveOnboardingStepOneForProfile(profileId, input);
      console.log('[SaveOnboardingStepOneUseCase] record obtenido:', record);

      if (!record) {
        console.log('[SaveOnboardingStepOneUseCase] Profile not found:', profileId);
        return {
          data: null,
          error: 'Profile not found',
          statusCode: 404,
        };
      }

      const data = toOnboardingStepOneData(record);
      console.log('[SaveOnboardingStepOneUseCase] ✓ Éxito:', data);
      
      return {
        data,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving onboarding step 1';
      console.error('[SaveOnboardingStepOneUseCase] ✗ Error:', { message, profileId, err });
      eventLogger.error('SaveOnboardingStepOneUseCase.execute', message, { profileId });
      return {
        data: null,
        error: 'Error saving onboarding step 1',
        statusCode: 500,
      };
    }
  }
}
