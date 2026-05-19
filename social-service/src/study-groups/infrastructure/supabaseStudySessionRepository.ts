import { supabase } from '../../utils/supabaseClient';
import { StudySession } from '../domain/entities/studySession';
import { StudySessionRepositoryPort } from '../domain/ports/studySessionRepositoryPort';

const TABLE_NAME = 'study_session';

const mapSession = (row: any): StudySession => ({
  id: row.id,
  groupId: row.group_id,
  creatorId: row.creator_id,
  name: row.name,
  description: row.description,
  location: row.location ?? undefined,
  startTime: row.start_time,
  endTime: row.end_time,
  seriesId: row.series_id,
  recurrenceType: row.recurrence_type,
  createdAt: row.created_at,
});

export class SupabaseStudySessionRepository implements StudySessionRepositoryPort {
  async createMany(sessions: Omit<StudySession, 'id' | 'createdAt'>[]): Promise<StudySession[]> {
    const records = sessions.map((s) => ({
      group_id: s.groupId,
      creator_id: s.creatorId,
      name: s.name,
      description: s.description,
      location: s.location ?? null,
      start_time: s.startTime,
      end_time: s.endTime,
      series_id: s.seriesId,
      recurrence_type: s.recurrenceType,
    }));

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(records)
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to create study sessions: ${error.message}`);
    }

    return (data || []).map(mapSession);
  }

  async findByGroupId(groupId: string): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('group_id', groupId)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch study sessions: ${error.message}`);
    }

    return (data || []).map(mapSession);
  }

  async findById(sessionId: string): Promise<StudySession | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch study session: ${error.message}`);
    }

    if (!data) return null;
    return mapSession(data);
  }

  async findUpcomingSessions(minutesFromNow: number): Promise<StudySession[]> {
    const TOLERANCE_MS = 90 * 1000; // ±90 seconds (matches cron notifier window)
    const targetMs = minutesFromNow * 60 * 1000;
    const from = new Date(Date.now() + targetMs - TOLERANCE_MS);
    const to   = new Date(Date.now() + targetMs + TOLERANCE_MS);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString());

    if (error) {
      throw new Error(`Failed to fetch upcoming study sessions: ${error.message}`);
    }

    return (data || []).map(mapSession);
  }

  async updateSession(sessionId: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt'>>): Promise<StudySession> {
    const updateRecord: any = {};
    if (updates.name !== undefined) updateRecord.name = updates.name;
    if (updates.description !== undefined) updateRecord.description = updates.description;
    if (updates.location !== undefined) updateRecord.location = updates.location;
    if (updates.startTime !== undefined) updateRecord.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateRecord.end_time = updates.endTime;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateRecord)
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update study session: ${error.message}`);
    }

    return mapSession(data);
  }

  async updateSeriesFrom(seriesId: string, fromDate: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt'>>): Promise<StudySession[]> {
    const updateRecord: any = {};
    if (updates.name !== undefined) updateRecord.name = updates.name;
    if (updates.description !== undefined) updateRecord.description = updates.description;
    if (updates.location !== undefined) updateRecord.location = updates.location;

    if (Object.keys(updateRecord).length === 0) {
      return [];
    }

    // Normalize fromDate: truncate to start of the day in UTC to avoid timezone-driven row exclusions.
    const normalizedFrom = new Date(fromDate);
    normalizedFrom.setUTCHours(0, 0, 0, 0);
    const fromDateNormalized = normalizedFrom.toISOString();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateRecord)
      .eq('series_id', seriesId)
      .gte('start_time', fromDateNormalized)
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to update study session series: ${error.message}`);
    }

    return (data || []).map(mapSession);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to delete study session: ${error.message}`);
    }
  }
}
