import { EventReadRepositoryPort } from '../../domain/ports/eventReadRepositoryPort';
import { EventWriteRepositoryPort } from '../../domain/ports/eventWriteRepositoryPort';

export interface CancelEventRegistrationInput {
  eventId: string;
  userId: string;
}

export class CancelEventRegistrationUseCase {
  private readonly notificationServiceUrl: string;

  constructor(
    private readonly eventReadRepo: EventReadRepositoryPort,
    private readonly eventWriteRepo: EventWriteRepositoryPort
  ) {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
  }

  async execute(input: CancelEventRegistrationInput): Promise<void> {
    const event = await this.eventReadRepo.findById(input.eventId);

    if (!event) {
      const error = new Error('Evento no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    // Validar regla de las 24 horas (usando zona horaria de Colombia UTC-5)
    const eventDateTime = new Date(`${event.eventDate}T${event.eventTime}-05:00`);
    const now = new Date();
    
    // Diferencia en horas
    const diffMs = eventDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const error = new Error('Política de cancelación: No puedes cancelar con menos de 24 horas de anticipación. Por favor, contacta al organizador directamente.');
      (error as any).statusCode = 400;
      throw error;
    }

    await this.eventWriteRepo.cancelRegistration(input.eventId, input.userId);

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
            }).catch((err: any) => console.error('[CancelEventRegistrationUseCase] Error sending broadcast', err));
          }
        });
      }
    } catch (e) {
      console.error('[CancelEventRegistrationUseCase] Error emitiendo broadcast', e);
    }

    this.notifyUser(input.userId, event.title).catch((err) => 
      console.error('[CancelEventRegistrationUseCase] Error enviando notificacion', err)
    );
  }

  private async notifyUser(userId: string, eventTitle: string): Promise<void> {
    try {
      const payload = {
        recipientUserId: userId,
        title: 'Cancelación de Registro',
        message: `Has cancelado tu registro para el evento: ${eventTitle}. El cupo ha sido liberado.`,
        type: 'SISTEMA',
      };

      await fetch(this.notificationServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`[Email Mock] Simulando envío de correo de cancelación a usuario ${userId} para el evento ${eventTitle}`);
    } catch (error) {
      console.error(`Error notifying user ${userId}:`, error);
    }
  }
}
