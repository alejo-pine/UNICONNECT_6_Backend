import { SupabaseNotificationRepository } from './infrastructure/supabaseNotificationRepository';
import { CreateNotificationUseCase } from './application/use-cases/createNotificationUseCase';
import { GetUserNotificationsUseCase } from './application/use-cases/getUserNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from './application/use-cases/markNotificationAsReadUseCase';
import { emitNotification } from './realtime/socketManager';
import { SendGridEmailService } from './infrastructure/sendGridEmailService';
import { SupabaseProfileRepository } from './infrastructure/supabaseProfileRepository';

const notificationRepository = new SupabaseNotificationRepository();
const profileRepository = new SupabaseProfileRepository();
const emailService = new SendGridEmailService();

export const notificationDependencies = {
  createNotificationUseCase: new CreateNotificationUseCase(
    notificationRepository,
    profileRepository,
    emailService,
    emitNotification
  ),
  getUserNotificationsUseCase: new GetUserNotificationsUseCase(notificationRepository),
  markNotificationAsReadUseCase: new MarkNotificationAsReadUseCase(notificationRepository),
};
