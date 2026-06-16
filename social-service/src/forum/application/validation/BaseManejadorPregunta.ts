import { IManejadorPregunta } from './IManejadorPregunta';
import { ValidationContextPregunta } from './ValidationContextPregunta';

export abstract class BaseManejadorPregunta implements IManejadorPregunta {
  private siguienteManejador?: IManejadorPregunta;

  public setSiguiente(manejador: IManejadorPregunta): IManejadorPregunta {
    this.siguienteManejador = manejador;
    return manejador;
  }

  public abstract manejar(pregunta: ValidationContextPregunta): Promise<void>;

  protected async manejarSiguiente(pregunta: ValidationContextPregunta): Promise<void> {
    if (this.siguienteManejador) {
      await this.siguienteManejador.manejar(pregunta);
    }
  }
}
