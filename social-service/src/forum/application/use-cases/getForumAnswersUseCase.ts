import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { ServiceResult } from '../dto/forumDto';
import { QuestionAnswerDetail } from '../../domain/entities/answer';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class GetForumAnswersUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(
    questionId: string,
    profileId: string
  ): Promise<ServiceResult<QuestionAnswerDetail[]>> {
    try {
      // 1. Verificar que la pregunta exista
      const question = await this.forumRepository.findQuestionById(questionId);
      if (!question) {
        throw new HttpError(404, 'La pregunta especificada no existe.');
      }

      // 2. Validar matrícula o docente en la asignatura correspondientes
      const [isEnrolled, isTeacher] = await Promise.all([
        this.forumRepository.verifyEnrollment(profileId, question.subjectId),
        this.forumRepository.isTeacher(profileId, question.subjectId),
      ]);

      if (!isEnrolled && !isTeacher) {
        throw new HttpError(
          403,
          'No tienes acceso a las respuestas de esta pregunta (debes estar matriculado o ser docente asignado).'
        );
      }

      // 3. Obtener respuestas
      const answers = await this.forumRepository.findAnswersByQuestion(questionId, profileId);

      return {
        data: answers,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('GetForumAnswersUseCase.execute', message, {
        questionId,
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
        error: 'Failed to retrieve answers',
        statusCode: 500,
      };
    }
  }
}
