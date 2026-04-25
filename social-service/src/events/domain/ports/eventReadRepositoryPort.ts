import { EventCardSummary, EventDetail } from '../entities/event';

export interface FindAllEventsOptions {
  limit?: number;
}

export interface EventReadRepositoryPort {
  findAll(options: FindAllEventsOptions): Promise<EventCardSummary[]>;
  findById(id: string): Promise<EventDetail | null>;
}
