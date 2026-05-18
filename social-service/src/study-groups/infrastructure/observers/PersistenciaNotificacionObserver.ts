import { IObserver, StudyGroupEvent, StudyGroupEventType } from '../../domain/events/studyGroupEvents';
import { eventLogger } from '../../../utils/eventLogger';

export class PersistenciaNotificacionObserver implements IObserver {
  private readonly notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
  }

  public async update(event: StudyGroupEvent): Promise<void> {
    try {
      const userIdToNotify = event.targetUserId;
      if (!userIdToNotify || userIdToNotify === event.actorUserId) {
        return;
      }

      const message = this.generateMessage(event);

      const payload = {
        recipientUserId: userIdToNotify,
        title: this.generateTitle(event),
        message: message,
        type: event.type,
        groupId: event.groupId,
      };

      const response = await fetch(this.notificationServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification. Status: ${response.status}`);
      }

      eventLogger.info(
        'PersistenciaNotificacionObserver.update',
        `Notificación enviada al notification-service para el usuario ${userIdToNotify}`,
        { eventType: event.type, groupId: event.groupId }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      eventLogger.error(
        'PersistenciaNotificacionObserver.update',
        `Fallo al enviar notificación para evento ${event?.type}`,
        { error: errorMessage, groupId: event?.groupId }
      );
    }
  }

  private generateTitle(event: StudyGroupEvent): string {
    switch (event.type) {
      case StudyGroupEventType.SOLICITUD_INGRESO:
        return 'Nueva Solicitud de Ingreso';
      case StudyGroupEventType.MIEMBRO_ACEPTADO:
        return 'Solicitud Aceptada';
      case StudyGroupEventType.MIEMBRO_RECHAZADO:
        return 'Solicitud Rechazada';
      case StudyGroupEventType.TRANSFERENCIA_ADMIN:
        return 'Transferencia de Admin';
      default:
        return 'Actualización de Grupo';
    }
  }

  private generateMessage(event: StudyGroupEvent): string {
    switch (event.type) {
      case StudyGroupEventType.SOLICITUD_INGRESO:
        return 'Tienes una nueva solicitud de ingreso a tu grupo de estudio.';
      case StudyGroupEventType.MIEMBRO_ACEPTADO:
        return 'Tu solicitud de ingreso al grupo de estudio ha sido aceptada.';
      case StudyGroupEventType.MIEMBRO_RECHAZADO:
        return 'Tu solicitud de ingreso al grupo de estudio ha sido rechazada.';
      case StudyGroupEventType.TRANSFERENCIA_ADMIN:
        return 'Se te ha solicitado asumir la administración de un grupo de estudio.';
      default:
        return 'Hay una nueva actualización en tu grupo de estudio.';
    }
  }
}
