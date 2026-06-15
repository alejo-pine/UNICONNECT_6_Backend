import { CompleteOnboardingUseCase } from './application/use-cases/completeOnboardingUseCase';
import { GetOnboardingProgramsUseCase } from './application/use-cases/getOnboardingProgramsUseCase';
import { GetOnboardingStatusUseCase } from './application/use-cases/getOnboardingStatusUseCase';
import { MarkNewProfileOnboardingRequiredUseCase } from './application/use-cases/markNewProfileOnboardingRequiredUseCase';
import { SaveOnboardingContactUseCase } from './application/use-cases/saveOnboardingContactUseCase';
import { SaveOnboardingStepOneUseCase } from './application/use-cases/saveOnboardingStepOneUseCase';
import { SupabaseOnboardingRepository } from './infrastructure/supabaseOnboardingRepository';
import { SupabaseProfileRepository } from '../profiles/infrastructure/supabaseProfileRepository';

const onboardingRepository = new SupabaseOnboardingRepository();
const profileRepository = new SupabaseProfileRepository();

export const onboardingDependencies = {
  getOnboardingStatusUseCase: new GetOnboardingStatusUseCase(onboardingRepository),
  completeOnboardingUseCase: new CompleteOnboardingUseCase(onboardingRepository, profileRepository),
  markNewProfileOnboardingRequiredUseCase: new MarkNewProfileOnboardingRequiredUseCase(onboardingRepository),
  saveOnboardingStepOneUseCase: new SaveOnboardingStepOneUseCase(onboardingRepository),
  saveOnboardingContactUseCase: new SaveOnboardingContactUseCase(onboardingRepository),
  getOnboardingProgramsUseCase: new GetOnboardingProgramsUseCase(onboardingRepository),
};
