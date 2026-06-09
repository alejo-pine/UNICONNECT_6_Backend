import supabase from '../utils/supabaseClient';
import { SyncedAuthProfile } from '../domain/entities/authProfile';
import { AuthProfileUpdates, AuthRepositoryPort } from '../domain/ports/authRepositoryPort';

const PROFILE_FIELDS =
  'id, auth0_id, email, name, role, avatar_url, career, semester, phone_number, created_at';

export class SupabaseAuthRepository implements AuthRepositoryPort {
  async findProfileByAuth0Id(auth0Id: string): Promise<SyncedAuthProfile | null> {
    const { data, error } = await supabase
      .from('profile')
      .select(PROFILE_FIELDS)
      .eq('auth0_id', auth0Id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SyncedAuthProfile | null) ?? null;
  }

  async findProfileByEmail(email: string): Promise<SyncedAuthProfile | null> {
    const { data, error } = await supabase
      .from('profile')
      .select(PROFILE_FIELDS)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SyncedAuthProfile | null) ?? null;
  }

  async updateAuthProfileById(
    profileId: string,
    updates: AuthProfileUpdates
  ): Promise<SyncedAuthProfile> {
    const { data, error } = await supabase
      .from('profile')
      .update(updates)
      .eq('id', profileId)
      .select(PROFILE_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SyncedAuthProfile;
  }

  async createAuthProfile(auth0Id: string, email: string, name: string): Promise<SyncedAuthProfile> {
    const { data, error } = await supabase
      .from('profile')
      .insert({
        auth0_id: auth0Id,
        email,
        name,
        onboarding_required: true,
      })
      .select(PROFILE_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SyncedAuthProfile;
  }
}
