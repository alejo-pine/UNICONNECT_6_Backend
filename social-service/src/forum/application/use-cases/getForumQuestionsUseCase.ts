import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { ServiceResult } from '../dto/forumDto';
import { SubjectQuestionDetail } from '../../domain/entities/question';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class GetForumQuestionsUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(
    subjectId: string,
    profileId: string
  ): Promise<ServiceResult<SubjectQuestionDetail[]>> {
    try {
      // Validar matrícula o docente
      const [isEnrolled, isTeacher] = await Promise.all([
        this.forumRepository.verifyEnrollment(profileId, subjectId),
        this.forumRepository.isTeacher(profileId, subjectId),
      ]);

      if (!isEnrolled && !isTeacher) {
        throw new HttpError(
          403,
          'No tienes acceso al foro de esta asignatura (debes estar matriculado o ser docente asignado).'
        );
      }

      const questions = await this.forumRepository.findQuestionsBySubject(subjectId);

      return {
        data: questions,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('GetForumQuestionsUseCase.execute', message, {
        subjectId,
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
        error: 'Failed to retrieve questions',
        statusCode: 500,
      };
    }
  }
}
