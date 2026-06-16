import { IUniversitySubject, UniversityEventType } from '../../domain/events/universityEvents';
import { EventWriteRepositoryPort } from '../../domain/ports/eventWriteRepositoryPort';

export interface CreateEventInput {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  eventDate: string;
  eventTime: string;
  location?: string | null;
  category: string;
  faculty?: string | null;
  profileId: string;
  capacity?: number;
}

export class CreateEventUseCase {
  constructor(
    private readonly writeRepository: EventWriteRepositoryPort,
    private readonly subject: IUniversitySubject
  ) {}

  async execute(input: CreateEventInput): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      // 1. Persist to DB
      const eventId = await this.writeRepository.create({
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        eventDate: input.eventDate,
        eventTime: input.eventTime,
        location: input.location ?? null,
        category: input.category,
        faculty: input.faculty ?? null,
        profileId: input.profileId,
        capacity: input.capacity,
      });

      // 2. Notify observers (sends notifications to subscribers of this category)
      await this.subject.notify({
        type: UniversityEventType.NUEVO_EVENTO,
        category: input.category,
        eventId,
        title: input.title,
      });

      return { success: true, data: { id: eventId } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create event';
      return { success: false, error: message };
    }
  }
}
