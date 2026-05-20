import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

export type VerificadorPermisos = (contexto: ValidationContext) => Promise<boolean>;

export class ValidarPermisosHandler extends ValidadorMensajeBase {
  constructor(private readonly verificarPermisos: VerificadorPermisos) {
    super();
  }

  protected async validar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    const tienePermiso = await this.verificarPermisos(contexto);

    if (!tienePermiso) {
      const destino =
        contexto.destinationType === 'dm'
          ? 'esta conversación'
          : 'este grupo';

      return {
        valido: false,
        codigoError: 'FORBIDDEN',
        detalle: `No tienes permiso para publicar en ${destino}`,
      };
    }

    return { valido: true };
  }
}
