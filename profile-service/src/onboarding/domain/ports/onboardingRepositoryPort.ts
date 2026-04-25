export interface OnboardingStateRecord {
  profile_id: string;
  onboarding_required: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
}

export interface ProgramOptionRecord {
  name: string;
}

export interface OnboardingStepOneRecord {
  profile_id: string;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
}

export interface OnboardingRepositoryPort {
  getOnboardingStateByProfileId(profileId: string): Promise<OnboardingStateRecord | null>;
  createPendingOnboardingForProfile(profileId: string): Promise<OnboardingStateRecord>;
  completeOnboardingForProfile(profileId: string, skipped: boolean): Promise<OnboardingStateRecord>;
  saveOnboardingStepOneForProfile(profileId: string, input: {
    career: string;
    semester: number;
    phoneNumber: string;
  }): Promise<OnboardingStepOneRecord | null>;
  saveOnboardingContactForProfile(profileId: string, input: {
    phoneNumber: string;
  }): Promise<OnboardingStepOneRecord | null>;
  findProgramsForOnboarding(search?: string, limit?: number): Promise<ProgramOptionRecord[]>;
}
