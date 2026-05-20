import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

const MENTION_REGEX = /@([\w.\-]+)/g;

const MAX_MENCIONES = 20;

export class ValidarMencionesHandler extends ValidadorMensajeBase {
  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    if (!contexto.content || contexto.content.trim().length === 0) {
      return { valido: true };
    }

    const regex = new RegExp(MENTION_REGEX.source, 'g');
    const mencionesUnicas = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(contexto.content)) !== null) {
      const username = match[1];
      if (username) {
        mencionesUnicas.add(username);
      }
    }

    if (mencionesUnicas.size > MAX_MENCIONES) {
      return {
        valido: false,
        codigoError: 'VALIDATION_ERROR',
        detalle: `El mensaje no puede contener más de ${MAX_MENCIONES} menciones únicas`,
      };
    }

    return { valido: true };
  }
}
