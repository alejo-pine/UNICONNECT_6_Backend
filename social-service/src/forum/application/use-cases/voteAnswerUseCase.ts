import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { ServiceResult } from '../dto/forumDto';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class VoteAnswerUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(
    answerId: string,
    profileId: string
  ): Promise<ServiceResult<{ voted: boolean }>> {
    try {
      // 1. Verificar existencia de la respuesta
      const answer = await this.forumRepository.findAnswerById(answerId);
      if (!answer) {
        throw new HttpError(404, 'La respuesta especificada no existe.');
      }

      // 2. Obtener la pregunta para validar matrícula en la asignatura correspondiente
      const question = await this.forumRepository.findQuestionById(answer.questionId);
      if (!question) {
        throw new HttpError(404, 'La pregunta asociada no existe.');
      }

      // 3. Validar matrícula o docente en la asignatura
      const [isEnrolled, isTeacher] = await Promise.all([
        this.forumRepository.verifyEnrollment(profileId, question.subjectId),
        this.forumRepository.isTeacher(profileId, question.subjectId),
      ]);

      if (!isEnrolled && !isTeacher) {
        throw new HttpError(
          403,
          'No tienes permiso para votar en este foro (debes estar matriculado o ser docente asignado).'
        );
      }

      // 4. Realizar toggle del voto
      const alreadyVoted = await this.forumRepository.hasVoted(profileId, answerId);
      if (alreadyVoted) {
        await this.forumRepository.removeVote(profileId, answerId);
      } else {
        await this.forumRepository.addVote(profileId, answerId);
      }

      return {
        data: { voted: !alreadyVoted },
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('VoteAnswerUseCase.execute', message, {
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
        error: 'Failed to vote for answer',
        statusCode: 500,
      };
    }
  }
}
