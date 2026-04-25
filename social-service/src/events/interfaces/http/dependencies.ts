import { GetAllEventsUseCase } from '../../application/use-cases/getAllEventsUseCase';
import { GetEventByIdUseCase } from '../../application/use-cases/getEventByIdUseCase';
import { SupabaseEventReadRepository } from '../../infrastructure/supabaseEventReadRepository';

const eventRepository = new SupabaseEventReadRepository();

export const eventDependencies = {
  getAllEventsUseCase: new GetAllEventsUseCase(eventRepository),
  getEventByIdUseCase: new GetEventByIdUseCase(eventRepository),
};
