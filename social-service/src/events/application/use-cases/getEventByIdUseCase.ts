import { eventLogger } from '../../../utils/eventLogger';
import { EventDetail } from '../../domain/entities/event';
import { EventReadRepositoryPort } from '../../domain/ports/eventReadRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';

export class GetEventByIdUseCase {
  constructor(private readonly eventRepository: EventReadRepositoryPort) {}

  async execute(id: string): Promise<ServiceResult<EventDetail>> {
    try {
      const data = await this.eventRepository.findById(id);
      if (!data) {
        eventLogger.warn('GetEventByIdUseCase.execute', 'Event not found', { id });
        return { data: null, error: 'Event not found', statusCode: 404 };
      }

      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching event';
      eventLogger.error('GetEventByIdUseCase.execute', message, { id });
      return { data: null, error: 'Error fetching event', statusCode: 500 };
    }
  }
}
