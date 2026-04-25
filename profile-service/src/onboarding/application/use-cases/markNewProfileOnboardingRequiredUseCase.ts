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

export class MarkNewProfileOnboardingRequiredUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(profileId: string): Promise<ServiceResult<OnboardingStatus>> {
    try {
      const state = await this.onboardingRepository.createPendingOnboardingForProfile(profileId);
      return {
        data: toOnboardingStatus(state),
        error: null,
        statusCode: 201,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating onboarding state';
      eventLogger.error('MarkNewProfileOnboardingRequiredUseCase.execute', message, { profileId });
      return {
        data: null,
        error: 'Error creating onboarding state',
        statusCode: 500,
      };
    }
  }
}
