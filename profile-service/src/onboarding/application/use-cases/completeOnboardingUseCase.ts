import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingStatus } from '../../domain/entities/onboarding';
import { OnboardingRepositoryPort, OnboardingStateRecord } from '../../domain/ports/onboardingRepositoryPort';

const toOnboardingStatus = (state: OnboardingStateRecord): OnboardingStatus => ({
  needsOnboarding: state.onboarding_required,
  isCompleted: !state.onboarding_required,
  completedAt: state.onboarding_completed_at,
  skippedAt: state.onboarding_skipped_at,
});

export class CompleteOnboardingUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(profileId: string, skipped: boolean): Promise<ServiceResult<OnboardingStatus>> {
    try {
      const state = await this.onboardingRepository.completeOnboardingForProfile(profileId, skipped);
      return {
        data: toOnboardingStatus(state),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error completing onboarding';
      eventLogger.error('CompleteOnboardingUseCase.execute', message, { profileId, skipped });
      return {
        data: null,
        error: 'Error completing onboarding',
        statusCode: 500,
      };
    }
  }
}
