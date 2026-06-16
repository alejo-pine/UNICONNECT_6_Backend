import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { ServiceResult } from '../dto/forumDto';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class AcceptAnswerUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(
    answerId: string,
    profileId: string,
    isAccepted: boolean
  ): Promise<ServiceResult<void>> {
    try {
      // 1. Verificar existencia de la respuesta
      const answer = await this.forumRepository.findAnswerById(answerId);
      if (!answer) {
        throw new HttpError(404, 'La respuesta especificada no existe.');
      }

      // 2. Obtener la pregunta para validar la asignatura correspondiente
      const question = await this.forumRepository.findQuestionById(answer.questionId);
      if (!question) {
        throw new HttpError(404, 'La pregunta asociada no existe.');
      }

      // 3. Validar que el usuario solicitante sea docente acreditado de la asignatura
      const isTeacherOfSubject = await this.forumRepository.isTeacher(profileId, question.subjectId);
      if (!isTeacherOfSubject) {
        throw new HttpError(
          403,
          'Solo el docente de la asignatura puede aceptar o desmarcar respuestas en este foro.'
        );
      }

      // 4. Limpiar cualquier respuesta previamente aceptada de la pregunta
      //    (garantiza máximo 1 respuesta aceptada por pregunta)
      await this.forumRepository.clearAcceptedAnswer(answer.questionId);

      // 5. Marcar o desmarcar la respuesta objetivo
      await this.forumRepository.acceptAnswer(answerId, isAccepted);

      // 6. Sincronizar el estado is_resolved de la pregunta según si queda una respuesta aceptada
      await this.forumRepository.markQuestionResolved(answer.questionId, isAccepted);

      return {
        data: null,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('AcceptAnswerUseCase.execute', message, {
        answerId,
        profileId,
      });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      return {
        data: null,
        error: 'Failed to accept answer',
        statusCode: 500,
      };
    }
  }
}
