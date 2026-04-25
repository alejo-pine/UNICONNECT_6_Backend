import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { SubjectRepositoryPort } from '../../domain/ports/subjectRepositoryPort';
import { CreateStudyGroupCommand, ServiceResult } from '../dto/studyGroupDto';

export class CreateStudyGroupUseCase {
  constructor(
    private readonly studyGroupRepository: StudyGroupRepositoryPort,
    private readonly subjectRepository: SubjectRepositoryPort
  ) {}

  async execute(command: CreateStudyGroupCommand): Promise<ServiceResult<StudyGroupResponse>> {
    try {
      if (!command.name.trim()) {
        throw new HttpError(400, 'Field "name" is required and must be a non-empty string');
      }

      if (!command.description.trim()) {
        throw new HttpError(400, 'Field "description" is required and must be a non-empty string');
      }

      if (!command.subjectId.trim()) {
        throw new HttpError(400, 'Field "subject_id" is required and must be a non-empty string');
      }

      const subjectExists = await this.subjectRepository.exists(command.subjectId);
      if (!subjectExists) {
        throw new HttpError(400, 'Subject does not exist');
      }

      const studyGroup = await this.studyGroupRepository.create({
        name: command.name.trim(),
        description: command.description.trim(),
        subjectId: command.subjectId.trim(),
        creatorId: command.creatorId,
      });

      return {
        data: {
          ...studyGroup,
          isAdmin: true,
          isMember: true,
        },
        error: null,
        statusCode: 201,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('CreateStudyGroupUseCase.execute', message, {
        creatorId: command.creatorId,
      });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      if (message.includes('violates unique constraint') || message.includes('UNIQUE')) {
        return {
          data: null,
          error: 'A study group with this name already exists',
          statusCode: 400,
        };
      }

      return {
        data: null,
        error: 'Failed to create study group',
        statusCode: 500,
      };
    }
  }
}
