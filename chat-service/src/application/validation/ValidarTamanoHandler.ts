import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';
import { MAX_FILE_SIZE_BYTES } from '../../shared/constants';

export class ValidarTamanoHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    const attachments = contexto.attachments;

    if (!attachments || attachments.length === 0) {
      return { valido: true };
    }

    for (const attachment of attachments) {
      if (attachment.fileSize > MAX_FILE_SIZE_BYTES) {
        return {
          valido: false,
          codigoError: 'VALIDATION_ERROR',
          detalle: `El archivo "${attachment.fileName}" supera el tamaño máximo permitido de 20 MB`,
        };
      }
    }

    return { valido: true };
  }
}
