import { Notification, CreateNotificationInput, NotificationType } from '../../domain/entities/notification';
import { NotificationRepositoryPort } from '../../domain/ports/notificationRepositoryPort';
import { EmailServicePort } from '../../domain/ports/emailServicePort';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';
import { CreateNotificationDto, NotificationResponseDto } from '../dto/notificationDto';
import { eventLogger } from '../../utils/eventLogger';

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

const isValidNotificationType = (type: string): type is NotificationType =>
  ['SOLICITUD_INGRESO', 'MIEMBRO_ACEPTADO', 'MIEMBRO_RECHAZADO', 'NUEVO_MENSAJE', 'EVENTO_GRUPO', 'SISTEMA', 'TRANSFERENCIA_ADMIN'].includes(type);

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly profileRepository: ProfileRepositoryPort,
    private readonly emailService: EmailServicePort,
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
        groupId: dto.groupId,
        emailHtml: dto.emailHtml,
      };

      const notification = await this.notificationRepository.create(input);
      // Asignar emailHtml y title original (ya que no se guardan en supabase)
      notification.emailHtml = dto.emailHtml;
      notification.title = dto.title.trim();

      this.onCreated?.(notification);

      eventLogger.info('CreateNotificationUseCase', 'Notificación creada', {
        notificationId: notification.id,
        recipientUserId: notification.recipientUserId,
        type: notification.type,
      });

      // Despachar email si es del tipo SISTEMA
      if (notification.type === 'SISTEMA') {
        this.dispatchEmail(notification).catch(err => {
          eventLogger.error('CreateNotificationUseCase', 'Error en dispatchEmail (en segundo plano)', { error: err.message });
        });
      }

      return { data: toResponseDto(notification), error: null, statusCode: 201 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creando notificación';
      eventLogger.error('CreateNotificationUseCase', message);
      return { data: null, error: 'Error interno al crear la notificación', statusCode: 500 };
    }
  }

  private async dispatchEmail(notification: Notification): Promise<void> {
    const email = await this.profileRepository.getUserEmail(notification.recipientUserId);
    if (!email) {
      eventLogger.warn('CreateNotificationUseCase', `No se encontró email para el usuario ${notification.recipientUserId}`);
      return;
    }

    const emailHtml = notification.emailHtml || `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2b6cb0;">UniConnect</h2>
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <hr style="border: 1px solid #e2e8f0; margin-top: 20px;" />
        <p style="font-size: 12px; color: #718096;">
          Has recibido este correo porque estás registrado en UniConnect y tienes activas las notificaciones del sistema.
        </p>
      </div>
    `;

    await this.emailService.sendEmail(email, notification.title, notification.message, emailHtml);
  }
}
