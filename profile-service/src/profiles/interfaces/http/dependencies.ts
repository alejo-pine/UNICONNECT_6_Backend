import { GetAllProfilesUseCase } from '../../application/use-cases/getAllProfilesUseCase';
import { GetProfileByIdUseCase } from '../../application/use-cases/getProfileByIdUseCase';
import { GetPublicProfileUseCase } from '../../application/use-cases/getPublicProfileUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/updateProfileUseCase';
import { UploadAvatarUseCase } from '../../application/use-cases/uploadAvatarUseCase';
import { SupabaseProfileRepository } from '../../infrastructure/supabaseProfileRepository';

const profileRepository = new SupabaseProfileRepository();

export const profileDependencies = {
  getAllProfilesUseCase: new GetAllProfilesUseCase(profileRepository),
  getProfileByIdUseCase: new GetProfileByIdUseCase(profileRepository),
  getPublicProfileUseCase: new GetPublicProfileUseCase(profileRepository),
  updateProfileUseCase: new UpdateProfileUseCase(profileRepository),
  uploadAvatarUseCase: new UploadAvatarUseCase(profileRepository),
};
