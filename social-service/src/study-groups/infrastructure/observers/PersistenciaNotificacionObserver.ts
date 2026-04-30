import { supabase } from '../../../utils/supabaseClient';
import { IObserver, StudyGroupEvent, StudyGroupEventType } from '../../domain/events/studyGroupEvents';
import { eventLogger } from '../../../utils/eventLogger';

export class PersistenciaNotificacionObserver implements IObserver {
  private readonly TABLE_NAME = 'notifications';

  public async update(event: StudyGroupEvent): Promise<void> {
    try {
      // 1. Evitar notificaciones duplicadas o innecesarias
      // Solo persistimos si hay un targetUserId (alguien a quien notificar)
      // y evitamos auto-notificaciones (actor == target)
      const userIdToNotify = event.targetUserId;
      if (!userIdToNotify || userIdToNotify === event.actorUserId) {
        return;
      }

      // 2. Generar el mensaje semántico basado en el tipo de evento
      const message = this.generateMessage(event);

      // 3. Persistencia en Base de Datos (Supabase)
      // Usamos snake_case para las columnas de la DB, mapeando desde los requisitos
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: userIdToNotify,
          type: event.type,
          message: message,
          group_id: event.groupId,
          created_at: new Date().toISOString(),
          read: false // Estado inicial de la notificación
        });

      if (error) {
        throw new Error(error.message);
      }

      eventLogger.info(
        'PersistenciaNotificacionObserver.update',
        `Notificación persistida exitosamente para el usuario ${userIdToNotify}`,
        { eventType: event.type, groupId: event.groupId }
      );

    } catch (error) {
      // Manejo de Errores sin afectar flujo principal:
      // Si la base de datos de notificaciones falla, no queremos que el usuario 
      // vea un Error 500 al aceptar a un miembro. Solo logueamos el error.
      const errorMessage = error instanceof Error ? error.message : String(error);
      eventLogger.error(
        'PersistenciaNotificacionObserver.update',
        `Fallo al persistir notificación para evento ${event?.type}`,
        { error: errorMessage, groupId: event?.groupId }
      );
    }
  }

  /**
   * Genera el texto legible para el usuario final dependiendo del evento de dominio.
   */
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
