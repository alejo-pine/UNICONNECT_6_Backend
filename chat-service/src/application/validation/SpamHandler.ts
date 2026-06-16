import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';
import { IModerationRepository } from '../../domain/repositories/IModerationRepository';
import { MODERATION_CONFIG } from '../../shared/constants';

export type ContarMensajesRecientes = (senderId: string, since: Date) => Promise<number>;

export class SpamHandler extends ValidadorMensajeBase {
  constructor(
    private readonly countRecent: ContarMensajesRecientes,
    private readonly moderationRepo: IModerationRepository
  ) {
    super();
  }

  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    // 1. Verificamos si ya está bloqueado por CUALQUIER motivo
    const bloqueoActivo = await this.moderationRepo.estaBloqueado(contexto.senderId);
    if (bloqueoActivo) {
      return {
        valido: false,
        codigoError: bloqueoActivo.codigo,
        detalle: `${bloqueoActivo.motivo} (Aún tienes un bloqueo temporal activo)`,
      };
    }

    // 2. Contamos mensajes en la ventana de tiempo
    const since = new Date(Date.now() - MODERATION_CONFIG.SPAM_TIME_WINDOW_SECONDS * 1000);
    const count = await this.countRecent(contexto.senderId, since);

    // Si con el mensaje actual excedería el límite, lo bloqueamos
    if (count >= MODERATION_CONFIG.SPAM_MAX_MESSAGES) {
      await this.moderationRepo.registrarBloqueo(
        contexto.senderId,
        'MO_003',
        'Spam detectado (límite de mensajes excedido)',
        MODERATION_CONFIG.SPAM_BLOCK_DURATION_SECONDS
      );

      return {
        valido: false,
        codigoError: 'MO_003',
        detalle: 'Demasiados mensajes en poco tiempo',
        nuevoBloqueo: true,
      };
    }

    return { valido: true };
  }
}
