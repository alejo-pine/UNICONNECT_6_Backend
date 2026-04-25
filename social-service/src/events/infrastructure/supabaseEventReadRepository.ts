import { eventDatabaseHandler } from '../../config/eventDatabaseHandler';
import { eventLogger } from '../../utils/eventLogger';
import { EventCardSummary, EventDetail } from '../domain/entities/event';
import { EventReadRepositoryPort, FindAllEventsOptions } from '../domain/ports/eventReadRepositoryPort';

const TABLE = 'event';

export class SupabaseEventReadRepository implements EventReadRepositoryPort {
  async findAll(options: FindAllEventsOptions = {}): Promise<EventCardSummary[]> {
    const { limit = 20 } = options;
    const db = eventDatabaseHandler.getClient();

    const { data, error } = await db
      .from(TABLE)
      .select('id, title, description, image_url, faculty, event_date, event_time')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .limit(limit);

    if (error) {
      eventLogger.error('SupabaseEventReadRepository.findAll', 'Supabase query failed', {
        limit,
        error: error.message,
      });
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Array<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      faculty: string | null;
      event_date: string;
      event_time: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      faculty: row.faculty,
      eventDate: row.event_date,
      eventTime: row.event_time,
    }));
  }

  async findById(id: string): Promise<EventDetail | null> {
    const db = eventDatabaseHandler.getClient();

    const { data, error } = await db
      .from(TABLE)
      .select(
        'id, profile_id, title, description, image_url, event_date, event_time, location, category, faculty, created_at, profile:profile_id(name)'
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        eventLogger.warn('SupabaseEventReadRepository.findById', 'Event not found', { id });
        return null;
      }

      eventLogger.error('SupabaseEventReadRepository.findById', 'Supabase query failed', {
        id,
        error: error.message,
      });
      throw new Error(error.message);
    }

    const row = data as {
      id: string;
      profile_id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      event_date: string;
      event_time: string;
      location: string | null;
      category: string | null;
      faculty: string | null;
      created_at: string;
      profile?: { name?: string | null } | Array<{ name?: string | null }> | null;
    };

    const profileData = Array.isArray(row.profile) ? row.profile[0] : row.profile;

    return {
      id: row.id,
      profileId: row.profile_id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      eventDate: row.event_date,
      eventTime: row.event_time,
      location: row.location,
      category: row.category,
      faculty: row.faculty,
      createdAt: row.created_at,
      organizerName: profileData?.name ?? null,
    };
  }
}
