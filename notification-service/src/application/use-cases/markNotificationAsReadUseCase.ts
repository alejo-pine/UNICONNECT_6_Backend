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
  read: n.read,
  createdAt: n.createdAt.toISOString(),
});

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {}

  async execute(notificationId: string): Promise<ServiceResult<NotificationResponseDto>> {
    try {
      if (!notificationId?.trim()) {
        return { data: null, error: 'notificationId es requerido', statusCode: 400 };
      }

      const existing = await this.notificationRepository.findById(notificationId.trim());
      if (!existing) {
        return { data: null, error: 'Notificación no encontrada', statusCode: 404 };
      }

      const updated = await this.notificationRepository.markAsRead(notificationId.trim());

      eventLogger.info('MarkNotificationAsReadUseCase', 'Notificación marcada como leída', {
        notificationId: updated.id,
      });

      return { data: toResponseDto(updated), error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error marcando notificación';
      eventLogger.error('MarkNotificationAsReadUseCase', message);
      return { data: null, error: 'Error interno al marcar la notificación', statusCode: 500 };
    }
  }
}
