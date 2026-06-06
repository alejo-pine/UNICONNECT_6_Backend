import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';
import { MODERATION_CONFIG } from '../../shared/constants';

export class LongitudHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    if (contexto.content && contexto.content.length > MODERATION_CONFIG.MAX_MESSAGE_LENGTH) {
      return {
        valido: false,
        codigoError: 'MO_001',
        detalle: 'Mensaje demasiado largo',
      };
    }
    return { valido: true };
  }
}
