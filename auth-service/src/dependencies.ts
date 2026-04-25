import { SyncAuthProfileByIdentityUseCase } from './application/use-cases/syncAuthProfileByIdentityUseCase';
import { SupabaseAuthRepository } from './infrastructure/supabaseAuthRepository';

const authRepository = new SupabaseAuthRepository();

export const authDependencies = {
  syncAuthProfileByIdentityUseCase: new SyncAuthProfileByIdentityUseCase(authRepository),
};
