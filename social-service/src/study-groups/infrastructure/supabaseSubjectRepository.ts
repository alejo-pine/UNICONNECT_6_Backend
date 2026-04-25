import { supabase } from '../../utils/supabaseClient';
import { SubjectRepositoryPort } from '../domain/ports/subjectRepositoryPort';

const SUBJECTS_TABLE = 'subject';

export class SupabaseSubjectRepository implements SubjectRepositoryPort {
  async exists(subjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(SUBJECTS_TABLE)
      .select('id')
      .eq('id', subjectId)
      .maybeSingle();

    if (error && error.message !== 'no rows') {
      throw new Error(`Failed to verify subject: ${error.message}`);
    }

    return !!data;
  }
}
