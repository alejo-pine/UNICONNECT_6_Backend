import { BaseManejadorPregunta } from './BaseManejadorPregunta';
import { ValidationContextPregunta } from './ValidationContextPregunta';
import { HttpError } from '../../../utils/httpError';

export class ContenidoValidationHandler extends BaseManejadorPregunta {
  public async manejar(pregunta: ValidationContextPregunta): Promise<void> {
    const { title, content } = pregunta;

    if (!title || title.trim().length < 5) {
      throw new HttpError(
        400,
        'El título de la pregunta debe tener al menos 5 caracteres.'
      );
    }

    if (!content || content.trim().length < 10) {
      throw new HttpError(
        400,
        'El contenido de la pregunta debe tener al menos 10 caracteres.'
      );
    }

    await this.manejarSiguiente(pregunta);
  }
}
