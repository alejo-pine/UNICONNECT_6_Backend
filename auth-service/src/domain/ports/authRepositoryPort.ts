import { SyncedAuthProfile } from '../entities/authProfile';

export type AuthProfileUpdates = Partial<Pick<SyncedAuthProfile, 'auth0_id' | 'email' | 'name'>>;

export interface AuthRepositoryPort {
  findProfileByAuth0Id(auth0Id: string): Promise<SyncedAuthProfile | null>;
  findProfileByEmail(email: string): Promise<SyncedAuthProfile | null>;
  updateAuthProfileById(profileId: string, updates: AuthProfileUpdates): Promise<SyncedAuthProfile>;
  createAuthProfile(auth0Id: string, email: string, name: string): Promise<SyncedAuthProfile>;
}
