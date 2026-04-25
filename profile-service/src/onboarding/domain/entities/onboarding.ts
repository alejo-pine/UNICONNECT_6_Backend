export interface OnboardingStatus {
  needsOnboarding: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  skippedAt: string | null;
}

export interface OnboardingStepOneData {
  profileId: string;
  career: string | null;
  semester: number | null;
  phoneNumber: string | null;
}

export interface OnboardingProgramOption {
  name: string;
}

export interface OnboardingStepOneInput {
  career: string;
  semester: number;
  phoneNumber: string;
}

export interface OnboardingContactInput {
  phoneNumber: string;
}
