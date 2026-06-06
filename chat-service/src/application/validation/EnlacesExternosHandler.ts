import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';
import { MODERATION_CONFIG } from '../../shared/constants';

export class EnlacesExternosHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    if (!contexto.content) {
      return { valido: true };
    }

    const regex = new RegExp(MODERATION_CONFIG.URL_REGEX);
    if (regex.test(contexto.content)) {
      return {
        valido: false,
        codigoError: 'MO_004',
        detalle: 'Mensaje contiene enlaces externos no permitidos',
      };
    }

    return { valido: true };
  }
}
