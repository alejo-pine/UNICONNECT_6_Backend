import { ValidationContextPregunta } from './ValidationContextPregunta';

export interface IManejadorPregunta {
  setSiguiente(manejador: IManejadorPregunta): IManejadorPregunta;
  manejar(pregunta: ValidationContextPregunta): Promise<void>;
}
