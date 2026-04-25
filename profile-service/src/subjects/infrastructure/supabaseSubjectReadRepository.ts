import { supabase } from '../../config/supabaseClient';
import { Subject, SubjectSummary } from '../domain/entities/subject';
import {
  FindAllSubjectsOptions,
  SubjectReadRepositoryPort,
} from '../domain/ports/subjectReadRepositoryPort';

const TABLE = 'subject';

export class SupabaseSubjectReadRepository implements SubjectReadRepositoryPort {
  async findAll(options: FindAllSubjectsOptions = {}): Promise<SubjectSummary[]> {
    const { search, limit = 20, program } = options;

    let query = supabase.from(TABLE).select('id, name').order('name', { ascending: true }).limit(limit);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (program) {
      query = query.ilike('program', program);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as SubjectSummary[];
  }

  async findById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, code, program, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    const row = data as {
      id: string;
      name: string;
      code: string;
      program: string | null;
      created_at: string;
    };

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      program: row.program,
      createdAt: row.created_at,
    };
  }

  async findByProfileId(profileId: string): Promise<SubjectSummary[]> {
    const { data, error } = await supabase
      .from('profile_subject')
      .select('subject:subject_id(id, name)')
      .eq('profile_id', profileId)
      .order('subject(name)', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    const rows = data as Array<{
      subject: SubjectSummary | SubjectSummary[] | null;
    }>;

    return rows
      .map((row) => {
        if (Array.isArray(row.subject)) {
          return row.subject.length > 0 ? row.subject[0] : null;
        }
        return row.subject;
      })
      .filter((subject): subject is SubjectSummary => subject !== null && subject !== undefined);
  }
}
