import { IValidadorMensajeHandler } from '../../domain/validation/IValidadorMensajeHandler';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { ResultadoValidacion } from '../../domain/validation/ResultadoValidacion';

export abstract class ValidadorMensajeBase implements IValidadorMensajeHandler {
  private siguiente: IValidadorMensajeHandler | null = null;

  setSiguiente(handler: IValidadorMensajeHandler): IValidadorMensajeHandler {
    this.siguiente = handler;
    return handler; 
  }

  async manejar(contexto: ValidationContext): Promise<ResultadoValidacion> {
    const resultado = await this.validar(contexto);

    if (!resultado.valido) {
      return resultado;
    }

    if (this.siguiente !== null) {
      return this.siguiente.manejar(contexto);
    }

    return { valido: true };
  }

  protected abstract validar(contexto: ValidationContext): Promise<ResultadoValidacion>;
}
