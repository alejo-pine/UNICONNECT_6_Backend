import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

export class PalabrasProhibidasHandler extends ValidadorMensajeBase {
  private readonly palabrasProhibidas: string[];

  constructor(palabras: string[]) {
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
        return {
          valido: false,
          codigoError: 'MO_002',
          detalle: 'Mensaje contiene contenido no permitido',
        };
      }
    }

    return { valido: true };
  }
}
