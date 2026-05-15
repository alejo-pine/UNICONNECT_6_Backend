import { SupabaseNotificationRepository } from './infrastructure/supabaseNotificationRepository';
import { CreateNotificationUseCase } from './application/use-cases/createNotificationUseCase';
import { GetUserNotificationsUseCase } from './application/use-cases/getUserNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from './application/use-cases/markNotificationAsReadUseCase';
import { emitNotification } from './realtime/socketManager';

const notificationRepository = new SupabaseNotificationRepository();

export const notificationDependencies = {
  createNotificationUseCase: new CreateNotificationUseCase(
    notificationRepository,
    emitNotification
  ),
  getUserNotificationsUseCase: new GetUserNotificationsUseCase(notificationRepository),
  markNotificationAsReadUseCase: new MarkNotificationAsReadUseCase(notificationRepository),
};
