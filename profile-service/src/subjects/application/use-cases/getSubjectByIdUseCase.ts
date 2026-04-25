import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { Subject } from '../../domain/entities/subject';
import { SubjectReadRepositoryPort } from '../../domain/ports/subjectReadRepositoryPort';

export class GetSubjectByIdUseCase {
  constructor(private readonly subjectRepository: SubjectReadRepositoryPort) {}

  async execute(id: string): Promise<ServiceResult<Subject>> {
    try {
      const data = await this.subjectRepository.findById(id);
      if (!data) {
        return { data: null, error: 'Subject not found', statusCode: 404 };
      }
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching subject';
      eventLogger.error('GetSubjectByIdUseCase.execute', message, { id });
      return { data: null, error: 'Error fetching subject', statusCode: 500 };
    }
  }
}
