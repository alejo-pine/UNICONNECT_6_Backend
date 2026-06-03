import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { CreateAnswerCommand, ServiceResult } from '../dto/forumDto';
import { QuestionAnswer } from '../../domain/entities/answer';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class CreateAnswerUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(command: CreateAnswerCommand): Promise<ServiceResult<QuestionAnswer>> {
    try {
      if (!command.content || command.content.trim().length === 0) {
        throw new HttpError(400, 'El contenido de la respuesta no puede estar vacío.');
      }

      // 1. Verificar existencia de la pregunta
      const question = await this.forumRepository.findQuestionById(command.questionId);
      if (!question) {
        throw new HttpError(404, 'La pregunta especificada no existe.');
      }

      // 2. Validar matrícula o docente
      const [isEnrolled, isTeacher] = await Promise.all([
        this.forumRepository.verifyEnrollment(command.authorId, question.subjectId),
        this.forumRepository.isTeacher(command.authorId, question.subjectId),
      ]);

      if (!isEnrolled && !isTeacher) {
        throw new HttpError(
          403,
          'No tienes permiso para responder en este foro (debes estar matriculado o ser docente asignado).'
        );
      }

      // 3. Crear respuesta
      const answer = await this.forumRepository.createAnswer({
        questionId: command.questionId,
        authorId: command.authorId,
        content: command.content.trim(),
      });

      return {
        data: answer,
        error: null,
        statusCode: 201,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('CreateAnswerUseCase.execute', message, {
        questionId: command.questionId,
        authorId: command.authorId,
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
        error: 'Failed to create answer',
        statusCode: 500,
      };
    }
  }
}
