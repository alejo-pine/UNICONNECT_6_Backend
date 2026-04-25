import { eventLogger } from '../../../utils/eventLogger';
import { EventCardSummary } from '../../domain/entities/event';
import { EventReadRepositoryPort, FindAllEventsOptions } from '../../domain/ports/eventReadRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';

export class GetAllEventsUseCase {
  constructor(private readonly eventRepository: EventReadRepositoryPort) {}

  async execute(options: FindAllEventsOptions = {}): Promise<ServiceResult<EventCardSummary[]>> {
    try {
      const data = await this.eventRepository.findAll(options);
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching events';
      eventLogger.error('GetAllEventsUseCase.execute', message, { options });
      return { data: null, error: 'Error fetching events', statusCode: 500 };
    }
  }
}
