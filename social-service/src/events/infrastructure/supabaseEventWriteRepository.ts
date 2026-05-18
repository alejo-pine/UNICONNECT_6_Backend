import { eventDatabaseHandler } from '../../config/eventDatabaseHandler';
import { CreateEventDto, EventWriteRepositoryPort } from '../domain/ports/eventWriteRepositoryPort';

export class SupabaseEventWriteRepository implements EventWriteRepositoryPort {
  private readonly TABLE = 'event';

  async create(dto: CreateEventDto): Promise<string> {
    const db = eventDatabaseHandler.getClient();

    const { data, error } = await db
      .from(this.TABLE)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        image_url: dto.imageUrl ?? null,
        event_date: dto.eventDate,
        event_time: dto.eventTime,
        location: dto.location ?? null,
        category: dto.category,
        faculty: dto.faculty ?? null,
        profile_id: dto.profileId,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }

    return (data as { id: string }).id;
  }
}
