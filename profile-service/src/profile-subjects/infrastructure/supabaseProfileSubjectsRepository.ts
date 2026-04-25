import { supabase } from '../../config/supabaseClient';
import { ProfileSubjectRelation, Subject } from '../domain/entities/profileSubject';
import { ProfileSubjectsRepositoryPort } from '../domain/ports/profileSubjectsRepositoryPort';

const TABLE = 'profile_subject';

interface ProfileSubjectWithSubjectRow {
  subject: Subject[] | null;
}

export class SupabaseProfileSubjectsRepository implements ProfileSubjectsRepositoryPort {
  async findSubjectsInfoByProfile(profileId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        `
      subject_id,
      subject (
        id,
        name,
        code,
        program,
        created_at
      )
    `
      )
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ProfileSubjectWithSubjectRow[])
      .flatMap((row) => row.subject ?? [])
      .filter((subject): subject is Subject => subject !== null);
  }

  async addSubjectToProfile(profileId: string, subjectId: string): Promise<ProfileSubjectRelation> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ profile_id: profileId, subject_id: subjectId }])
      .select('profile_id, subject_id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as ProfileSubjectRelation;
  }

  async removeSubjectFromProfile(profileId: string, subjectId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('profile_id', profileId)
      .eq('subject_id', subjectId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }
}
