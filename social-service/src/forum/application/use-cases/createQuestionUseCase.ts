import { ForumRepositoryPort } from '../../domain/ports/forumRepositoryPort';
import { CreateQuestionCommand, ServiceResult } from '../dto/forumDto';
import { SubjectQuestion } from '../../domain/entities/question';
import { MatriculaValidationHandler } from '../validation/MatriculaValidationHandler';
import { ContenidoValidationHandler } from '../validation/ContenidoValidationHandler';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';

export class CreateQuestionUseCase {
  constructor(private readonly forumRepository: ForumRepositoryPort) {}

  async execute(command: CreateQuestionCommand): Promise<ServiceResult<SubjectQuestion>> {
    try {
      // 1. Configurar la cadena de validación (Chain of Responsibility)
      const matriculaHandler = new MatriculaValidationHandler(this.forumRepository);
      const contenidoHandler = new ContenidoValidationHandler();

      matriculaHandler.setSiguiente(contenidoHandler);

      // 2. Ejecutar validación
      await matriculaHandler.manejar({
        subjectId: command.subjectId,
        profileId: command.authorId,
        title: command.title,
        content: command.content,
      });

      // 3. Crear la pregunta si las validaciones pasan exitosamente
      const question = await this.forumRepository.createQuestion({
        subjectId: command.subjectId,
        authorId: command.authorId,
        title: command.title,
        content: command.content,
      });

      return {
        data: question,
        error: null,
        statusCode: 201,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('CreateQuestionUseCase.execute', message, {
        authorId: command.authorId,
        subjectId: command.subjectId,
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
        error: 'Failed to create question',
        statusCode: 500,
      };
    }
  }
}
