import { supabase } from '../../config/supabaseClient';
import { ClassmateProfile } from '../domain/entities/classmate';
import { StudentRepositoryPort } from '../domain/ports/studentRepositoryPort';

const PIVOT_TABLE = 'profile_subject';

export class SupabaseStudentRepository implements StudentRepositoryPort {
  async verifyEnrollment(profileId: string, subjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(PIVOT_TABLE)
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data !== null;
  }

  async findClassmatesBySubject(
    subjectId: string,
    currentProfileId: string
  ): Promise<ClassmateProfile[]> {
    const { data, error } = await supabase
      .from(PIVOT_TABLE)
      .select('profile:profile_id(id, name, career, semester, avatar_url)')
      .eq('subject_id', subjectId)
      .neq('profile_id', currentProfileId);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Array<{
      profile: ClassmateProfile | ClassmateProfile[] | null;
    }>;

    return rows
      .map((row) => {
        if (Array.isArray(row.profile)) {
          return row.profile.length > 0 ? row.profile[0] : null;
        }
        return row.profile;
      })
      .filter((profile): profile is ClassmateProfile => Boolean(profile));
  }
}
