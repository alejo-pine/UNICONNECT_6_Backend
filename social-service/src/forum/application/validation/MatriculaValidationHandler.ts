import { BaseManejadorPregunta } from './BaseManejadorPregunta';
import { ValidationContextPregunta } from './ValidationContextPregunta';
import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { HttpError } from '../../../utils/httpError';

export class MatriculaValidationHandler extends BaseManejadorPregunta {
  constructor(private forumRepository: ForumRepositoryPort) {
    super();
  }

  public async manejar(pregunta: ValidationContextPregunta): Promise<void> {
    const { profileId, subjectId } = pregunta;

    // Verificar matrícula o si es docente
    const [isEnrolled, isTeacherOfSubject] = await Promise.all([
      this.forumRepository.verifyEnrollment(profileId, subjectId),
      this.forumRepository.isTeacher(profileId, subjectId),
    ]);

    if (!isEnrolled && !isTeacherOfSubject) {
      throw new HttpError(
        403,
        'No tienes permiso para acceder al foro de esta asignatura (debes estar matriculado o ser docente asignado).'
      );
    }

    await this.manejarSiguiente(pregunta);
  }
}
