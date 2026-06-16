import { EventCardSummary, EventDetail } from '../entities/event';

export interface FindAllEventsOptions {
  limit?: number;
  page?: number;
  categories?: string[];
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface EventReadRepositoryPort {
  findAll(options: FindAllEventsOptions): Promise<PaginatedResult<EventCardSummary>>;
  findById(id: string, userId?: string): Promise<EventDetail | null>;
}
