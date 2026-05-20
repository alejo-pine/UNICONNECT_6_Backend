import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';
import { ALLOWED_MIME_TYPES } from '../../shared/constants';

export class ValidarAdjuntoHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    const attachments = contexto.attachments;

    if (!attachments || attachments.length === 0) {
      return { valido: true };
    }

    for (const attachment of attachments) {
      if (!ALLOWED_MIME_TYPES.includes(attachment.fileType)) {
        return {
          valido: false,
          codigoError: 'INVALID_MIME_TYPE',
          detalle: `Tipo de archivo no permitido: "${attachment.fileType}". ` +
            `Tipos aceptados: ${ALLOWED_MIME_TYPES.join(', ')}`,
        };
      }
    }

    return { valido: true };
  }
}
