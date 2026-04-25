import { supabase } from '../../config/supabaseClient';
import {
  OnboardingRepositoryPort,
  OnboardingStateRecord,
  OnboardingStepOneRecord,
  ProgramOptionRecord,
} from '../domain/ports/onboardingRepositoryPort';

const TABLE = 'profile';
const SUBJECT_TABLE = 'subject';

const SELECT_FIELDS = 'id, onboarding_required, onboarding_completed_at, onboarding_skipped_at';
const STEP_ONE_FIELDS = 'id, career, semester, phone_number';

export class SupabaseOnboardingRepository implements OnboardingRepositoryPort {
  async getOnboardingStateByProfileId(profileId: string): Promise<OnboardingStateRecord | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_FIELDS)
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      profile_id: data.id as string,
      onboarding_required: Boolean(data.onboarding_required),
      onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
      onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
    };
  }

  async createPendingOnboardingForProfile(profileId: string): Promise<OnboardingStateRecord> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        onboarding_required: true,
        onboarding_completed_at: null,
        onboarding_skipped_at: null,
      })
      .eq('id', profileId)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      profile_id: data.id as string,
      onboarding_required: Boolean(data.onboarding_required),
      onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
      onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
    };
  }

  async completeOnboardingForProfile(profileId: string, skipped: boolean): Promise<OnboardingStateRecord> {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        onboarding_required: false,
        onboarding_completed_at: nowIso,
        onboarding_skipped_at: skipped ? nowIso : null,
      })
      .eq('id', profileId)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      profile_id: data.id as string,
      onboarding_required: Boolean(data.onboarding_required),
      onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
      onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
    };
  }

  async saveOnboardingStepOneForProfile(
    profileId: string,
    input: { career: string; semester: number; phoneNumber: string }
  ): Promise<OnboardingStepOneRecord | null> {
    try {
      console.log('[SupabaseOnboardingRepository] saveOnboardingStepOneForProfile iniciando...', { profileId, input });
      
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          career: input.career,
          semester: input.semester,
          phone_number: input.phoneNumber,
        })
        .eq('id', profileId)
        .select(STEP_ONE_FIELDS)
        .maybeSingle();

      console.log('[SupabaseOnboardingRepository] Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('[SupabaseOnboardingRepository] Error de Supabase:', error);
        throw new Error(error.message);
      }

      if (!data) {
        console.log('[SupabaseOnboardingRepository] No data returned - profile not found:', profileId);
        return null;
      }

      const record = {
        profile_id: data.id as string,
        career: (data.career as string | null) ?? null,
        semester: (data.semester as number | null) ?? null,
        phone_number: (data.phone_number as string | null) ?? null,
      };
      
      console.log('[SupabaseOnboardingRepository] ✓ Record guardado:', record);
      return record;
    } catch (err) {
      console.error('[SupabaseOnboardingRepository] ✗ Error capturado:', err);
      throw err;
    }
  }

  async saveOnboardingContactForProfile(
    profileId: string,
    input: { phoneNumber: string }
  ): Promise<OnboardingStepOneRecord | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        phone_number: input.phoneNumber,
      })
      .eq('id', profileId)
      .select(STEP_ONE_FIELDS)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      profile_id: data.id as string,
      career: (data.career as string | null) ?? null,
      semester: (data.semester as number | null) ?? null,
      phone_number: (data.phone_number as string | null) ?? null,
    };
  }

  async findProgramsForOnboarding(search?: string, limit = 20): Promise<ProgramOptionRecord[]> {
    try {
      console.log('[SupabaseOnboardingRepository] findProgramsForOnboarding iniciando...', { search, limit });
      
      let query = supabase
        .from(SUBJECT_TABLE)
        .select('program')
        .not('program', 'is', null)
        .order('program', { ascending: true })
        .limit(limit * 5);

      if (search) {
        query = query.ilike('program', `%${search}%`);
      }

      const { data, error } = await query;
      console.log('[SupabaseOnboardingRepository] Respuesta de Supabase:', { data: data?.length || 0, error });

      if (error) {
        console.error('[SupabaseOnboardingRepository] Error de Supabase:', error);
        throw new Error(error.message);
      }

      const unique = new Set<string>();
      for (const row of data ?? []) {
        const value = typeof row.program === 'string' ? row.program.trim() : '';
        if (value) {
          unique.add(value);
        }
      }

      const result = Array.from(unique)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, limit)
        .map((name) => ({ name }));
      
      console.log('[SupabaseOnboardingRepository] ✓ Programas únicos:', result.length);
      return result;
    } catch (err) {
      console.error('[SupabaseOnboardingRepository] ✗ Error capturado:', err);
      throw err;
    }
  }
}
