import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

import { IModerationRepository } from '../../domain/repositories/IModerationRepository';
import { MODERATION_CONFIG } from '../../shared/constants';

export class PalabrasProhibidasHandler extends ValidadorMensajeBase {
  private readonly palabrasProhibidas: string[];

  constructor(
    palabras: string[],
    private readonly moderationRepo?: IModerationRepository
  ) {
    super();
    this.palabrasProhibidas = palabras.map(p => p.toLowerCase());
  }

  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    if (!contexto.content) {
      return { valido: true };
    }

    const texto = contexto.content.toLowerCase();

    for (const palabra of this.palabrasProhibidas) {
      if (texto.includes(palabra)) {
        if (this.moderationRepo) {
          await this.moderationRepo.registrarBloqueo(
            contexto.senderId,
            'MO_002',
            'Contenido no permitido',
            0 // Duración 0: Solo genera el reporte en el historial pero no bloquea al usuario
          );
        }
        
        return {
          valido: false,
          codigoError: 'MO_002',
          detalle: 'Mensaje contiene contenido no permitido',
          nuevoBloqueo: !!this.moderationRepo,
        };
      }
    }

    return { valido: true };
  }
}
