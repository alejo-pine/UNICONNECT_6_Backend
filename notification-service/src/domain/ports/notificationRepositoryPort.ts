import { Notification, CreateNotificationInput } from '../entities/notification';

export interface NotificationRepositoryPort {
  create(input: CreateNotificationInput): Promise<Notification>;
  findByUserId(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification>;
  findById(notificationId: string): Promise<Notification | null>;
}
