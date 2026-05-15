import { Notification, CreateNotificationInput, NotificationType } from '../../domain/entities/notification';
import { NotificationRepositoryPort } from '../../domain/ports/notificationRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';
import { CreateNotificationDto, NotificationResponseDto } from '../dto/notificationDto';
import { eventLogger } from '../../utils/eventLogger';

const toResponseDto = (n: Notification): NotificationResponseDto => ({
  id: n.id,
  recipientUserId: n.recipientUserId,
  title: n.title,
  message: n.message,
  type: n.type,
  read: n.read,
  createdAt: n.createdAt.toISOString(),
});

const isValidNotificationType = (type: string): type is NotificationType =>
  ['SOLICITUD_INGRESO', 'MIEMBRO_ACEPTADO', 'MIEMBRO_RECHAZADO', 'NUEVO_MENSAJE', 'EVENTO_GRUPO', 'SISTEMA'].includes(type);

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly onCreated?: (notification: Notification) => void
  ) {}

  async execute(dto: CreateNotificationDto): Promise<ServiceResult<NotificationResponseDto>> {
    try {
      if (!dto.recipientUserId?.trim()) {
        return { data: null, error: 'recipientUserId es requerido', statusCode: 400 };
      }
      if (!dto.title?.trim()) {
        return { data: null, error: 'title es requerido', statusCode: 400 };
      }
      if (!dto.message?.trim()) {
        return { data: null, error: 'message es requerido', statusCode: 400 };
      }
      if (!isValidNotificationType(dto.type)) {
        return { data: null, error: `type inválido: ${dto.type}`, statusCode: 400 };
      }

      const input: CreateNotificationInput = {
        recipientUserId: dto.recipientUserId.trim(),
        title: dto.title.trim(),
        message: dto.message.trim(),
        type: dto.type,
      };

      const notification = await this.notificationRepository.create(input);

      this.onCreated?.(notification);

      eventLogger.info('CreateNotificationUseCase', 'Notificación creada', {
        notificationId: notification.id,
        recipientUserId: notification.recipientUserId,
        type: notification.type,
      });

      return { data: toResponseDto(notification), error: null, statusCode: 201 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creando notificación';
      eventLogger.error('CreateNotificationUseCase', message);
      return { data: null, error: 'Error interno al crear la notificación', statusCode: 500 };
    }
  }
}
