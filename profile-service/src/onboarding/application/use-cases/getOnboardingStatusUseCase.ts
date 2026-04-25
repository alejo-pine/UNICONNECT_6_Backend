import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingStatus } from '../../domain/entities/onboarding';
import { OnboardingRepositoryPort, OnboardingStateRecord } from '../../domain/ports/onboardingRepositoryPort';

const toOnboardingStatus = (state: OnboardingStateRecord | null): OnboardingStatus => {
  if (!state) {
    return {
      needsOnboarding: false,
      isCompleted: true,
      completedAt: null,
      skippedAt: null,
    };
  }

  return {
    needsOnboarding: state.onboarding_required,
    isCompleted: !state.onboarding_required,
    completedAt: state.onboarding_completed_at,
    skippedAt: state.onboarding_skipped_at,
  };
};

export class GetOnboardingStatusUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(profileId: string): Promise<ServiceResult<OnboardingStatus>> {
    try {
      const state = await this.onboardingRepository.getOnboardingStateByProfileId(profileId);
      return {
        data: toOnboardingStatus(state),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error getting onboarding status';
      eventLogger.error('GetOnboardingStatusUseCase.execute', message, { profileId });
      return {
        data: null,
        error: 'Error getting onboarding status',
        statusCode: 500,
      };
    }
  }
}
