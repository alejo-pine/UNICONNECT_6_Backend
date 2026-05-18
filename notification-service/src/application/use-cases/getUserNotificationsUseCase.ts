import { NotificationRepositoryPort } from '../../domain/ports/notificationRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';
import { NotificationResponseDto } from '../dto/notificationDto';
import { eventLogger } from '../../utils/eventLogger';
import { Notification } from '../../domain/entities/notification';

const toResponseDto = (n: Notification): NotificationResponseDto => ({
  id: n.id,
  recipientUserId: n.recipientUserId,
  title: n.title,
  message: n.message,
  type: n.type,
  groupId: n.groupId,
  read: n.read,
  createdAt: n.createdAt.toISOString(),
});

export class GetUserNotificationsUseCase {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {}

  async execute(userId: string): Promise<ServiceResult<NotificationResponseDto[]>> {
    try {
      if (!userId?.trim()) {
        return { data: null, error: 'userId es requerido', statusCode: 400 };
      }

      const notifications = await this.notificationRepository.findByUserId(userId.trim());

      return { data: notifications.map(toResponseDto), error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error obteniendo notificaciones';
      eventLogger.error('GetUserNotificationsUseCase', message);
      return { data: null, error: 'Error interno al obtener notificaciones', statusCode: 500 };
    }
  }
}
