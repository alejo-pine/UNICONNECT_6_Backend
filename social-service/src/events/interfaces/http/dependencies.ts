import { GetAllEventsUseCase } from '../../application/use-cases/getAllEventsUseCase';
import { GetEventByIdUseCase } from '../../application/use-cases/getEventByIdUseCase';
import { SupabaseEventReadRepository } from '../../infrastructure/supabaseEventReadRepository';
import { SupabaseEventWriteRepository } from '../../infrastructure/supabaseEventWriteRepository';
import { SupabaseEventSubscriptionRepository } from '../../infrastructure/supabaseEventSubscriptionRepository';
import { SubscribeCategoryUseCase } from '../../application/use-cases/subscribeCategoryUseCase';
import { UnsubscribeCategoryUseCase } from '../../application/use-cases/unsubscribeCategoryUseCase';
import { CreateEventUseCase } from '../../application/use-cases/createEventUseCase';
import { RegisterToEventUseCase } from '../../application/use-cases/registerToEventUseCase';
import { CancelEventRegistrationUseCase } from '../../application/use-cases/cancelEventRegistrationUseCase';
import { eventoUniversidadSubject } from '../../domain/events/eventoUniversidadSubject';
import { NotificationServiceObserver } from '../../infrastructure/observers/NotificationServiceObserver';

const eventReadRepository = new SupabaseEventReadRepository();
const eventWriteRepository = new SupabaseEventWriteRepository();
const eventSubscriptionRepository = new SupabaseEventSubscriptionRepository();

// Wire observer to subject
const notificationObserver = new NotificationServiceObserver(eventSubscriptionRepository);
eventoUniversidadSubject.subscribe(notificationObserver);

export const eventDependencies = {
  getAllEventsUseCase: new GetAllEventsUseCase(eventReadRepository),
  getEventByIdUseCase: new GetEventByIdUseCase(eventReadRepository),
  subscribeCategoryUseCase: new SubscribeCategoryUseCase(eventSubscriptionRepository),
  unsubscribeCategoryUseCase: new UnsubscribeCategoryUseCase(eventSubscriptionRepository),
  createEventUseCase: new CreateEventUseCase(eventWriteRepository, eventoUniversidadSubject),
  registerToEventUseCase: new RegisterToEventUseCase(eventReadRepository, eventWriteRepository),
  cancelEventRegistrationUseCase: new CancelEventRegistrationUseCase(eventReadRepository, eventWriteRepository),
  eventSubscriptionRepository,
};
