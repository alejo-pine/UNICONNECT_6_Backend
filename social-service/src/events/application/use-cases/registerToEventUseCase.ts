import { EventReadRepositoryPort } from '../../domain/ports/eventReadRepositoryPort';
import { EventWriteRepositoryPort } from '../../domain/ports/eventWriteRepositoryPort';

export interface RegisterToEventInput {
  eventId: string;
  userId: string;
}

export class RegisterToEventUseCase {
  private readonly notificationServiceUrl: string;

  constructor(
    private readonly eventReadRepo: EventReadRepositoryPort,
    private readonly eventWriteRepo: EventWriteRepositoryPort
  ) {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
  }

  async execute(input: RegisterToEventInput): Promise<void> {
    const event = await this.eventReadRepo.findById(input.eventId);

    if (!event) {
      const error = new Error('Evento no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    if (event.availableSpots <= 0) {
      const error = new Error('Cupo agotado');
      (error as any).statusCode = 409;
      throw error;
    }

    // Attempt to register with optimistic locking
    try {
      await this.eventWriteRepo.registerUser(input.eventId, input.userId, event.version);
    } catch (err: any) {
      if (err.message.includes('Concurrency') || err.message.includes('agotado')) {
        const error = new Error('Cupo agotado');
        (error as any).statusCode = 409;
        throw error;
      }
      throw err;
    }

    // Emitir evento a Supabase Realtime
    try {
      const { supabase } = require('../../../utils/supabaseClient');
      const updatedEvent = await this.eventReadRepo.findById(input.eventId);
      if (updatedEvent) {
        const channel = supabase.channel(`event_updates_${input.eventId}`);
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'spots_changed',
              payload: { available_spots: updatedEvent.availableSpots },
            }).then(() => {
              supabase.removeChannel(channel);
            }).catch((err: any) => console.error('[RegisterToEventUseCase] Error sending broadcast', err));
          }
        });
      }
    } catch (e) {
      console.error('[RegisterToEventUseCase] Error emitiendo broadcast', e);
    }

    // Notificar confirmación en plataforma
    this.notifyUser(input.userId, event.title, event).catch((err) => 
      console.error('[RegisterToEventUseCase] Error enviando notificacion', err)
    );
  }

  private async notifyUser(userId: string, eventTitle: string, event: any): Promise<void> {
    try {
      const formattedDate = new Date(`${event.eventDate}T00:00:00`).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = event.eventTime;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #00284D; text-align: center;">UniConnect</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <h3 style="color: #D4AF37; margin-top: 0;">Suscripción exitosa al evento</h3>
            <p>Hola,</p>
            <p>Te has registrado exitosamente al evento <strong>${eventTitle}</strong>.</p>
            ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${eventTitle}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" />` : ''}
            
            <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">Fecha:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Hora:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Ubicación:</td>
                <td style="padding: 8px 0; color: #4b5563;">${event.location || 'Por definir'}</td>
              </tr>
            </table>
            
            <p style="margin-top: 25px; margin-bottom: 0;">¡Te esperamos!</p>
          </div>
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px;">
            Has recibido este correo porque estás registrado en UniConnect y tienes activas las notificaciones de eventos.
          </p>
        </div>
      `;

      const payload = {
        recipientUserId: userId,
        title: `Suscripción exitosa: ${eventTitle}`,
        message: `Te has registrado exitosamente al evento: ${eventTitle}. ¡Te esperamos!`,
        type: 'SISTEMA',
        emailHtml,
      };

      await fetch(this.notificationServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`[Email Mock] Petición de notificación enviada a notification-service para usuario ${userId}`);
    } catch (error) {
      console.error(`Error notifying user ${userId}:`, error);
    }
  }
}
