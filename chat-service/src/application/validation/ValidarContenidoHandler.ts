import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

export class ValidarContenidoHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    const tieneTexto =
      contexto.content !== undefined && contexto.content.trim().length > 0;

    const tieneAdjuntos =
      contexto.attachments !== undefined && contexto.attachments.length > 0;

    if (!tieneTexto && !tieneAdjuntos) {
      return {
        valido: false,
        codigoError: 'VALIDATION_ERROR',
        detalle: 'El mensaje debe tener contenido o al menos un adjunto',
      };
    }

    return { valido: true };
  }
}
