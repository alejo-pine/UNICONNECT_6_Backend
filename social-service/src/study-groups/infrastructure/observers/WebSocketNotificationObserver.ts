import { Server as SocketIOServer } from 'socket.io';
import { IObserver, StudyGroupEvent, StudyGroupEventType } from '../../domain/events/studyGroupEvents';
import { eventLogger } from '../../../utils/eventLogger';

export class WebSocketNotificationObserver implements IObserver {
  // Evento estándar que el frontend escuchará
  private readonly DOMAIN_EVENT_NAME = 'study-group:domain-event';

  constructor(private readonly io: SocketIOServer) {}

  public async update(event: StudyGroupEvent): Promise<void> {
    try {
      // 1. Validar que tengamos datos mínimos para emitir
      if (!event.groupId || !event.type) {
        eventLogger.warn(
          'WebSocketNotificationObserver.update',
          'Intento de emitir evento incompleto. Se ignoró.',
          { event }
        );
        return;
      }

      // Payload estandarizado para el cliente
      const payload = {
        type: event.type,
        groupId: event.groupId,
        actorUserId: event.actorUserId,
        data: event.metadata || {},
        timestamp: new Date().toISOString()
      };

      // 2. Emitir a la sala del grupo (usuarios viendo la página de ese grupo específico)
      const groupRoom = `study-group:${event.groupId}`;
      this.io.to(groupRoom).emit(this.DOMAIN_EVENT_NAME, payload);

      // 3. Emitir a la sala personal del usuario objetivo (ej: para notificaciones de navbar)
      // Validamos explícitamente que targetUserId sea un string válido y no el mismo actor (para no auto-notificarse si no es necesario)
      if (
        event.targetUserId && 
        typeof event.targetUserId === 'string' && 
        event.targetUserId.trim().length > 0 &&
        event.targetUserId !== event.actorUserId
      ) {
        const userRoom = `user:${event.targetUserId}`;
        this.io.to(userRoom).emit(this.DOMAIN_EVENT_NAME, payload);
      }

      eventLogger.info(
        'WebSocketNotificationObserver',
        `Evento ${event.type} distribuido vía WebSockets`,
        { groupId: event.groupId, targetUserId: event.targetUserId }
      );
      
    } catch (error) {
      // Manejo estricto de errores: el fallo del socket no debe crashear la app
      const errorMessage = error instanceof Error ? error.message : String(error);
      eventLogger.error(
        'WebSocketNotificationObserver',
        `Fallo al emitir evento ${event?.type} vía WebSockets`,
        { error: errorMessage, groupId: event?.groupId }
      );
    }
  }
}
