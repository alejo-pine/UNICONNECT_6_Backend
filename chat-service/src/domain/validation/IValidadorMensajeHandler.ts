import { ValidationContext } from './ValidationContext';
import { ResultadoValidacion } from './ResultadoValidacion';

export interface IValidadorMensajeHandler {
  setSiguiente(handler: IValidadorMensajeHandler): IValidadorMensajeHandler;

  manejar(contexto: ValidationContext): Promise<ResultadoValidacion>;
}
