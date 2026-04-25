import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { SubjectSummary } from '../../domain/entities/subject';
import {
  FindAllSubjectsOptions,
  SubjectReadRepositoryPort,
} from '../../domain/ports/subjectReadRepositoryPort';

export class GetAllSubjectsUseCase {
  constructor(private readonly subjectRepository: SubjectReadRepositoryPort) {}

  async execute(options: FindAllSubjectsOptions): Promise<ServiceResult<SubjectSummary[]>> {
    try {
      const data = await this.subjectRepository.findAll(options);
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching subjects';
      eventLogger.error('GetAllSubjectsUseCase.execute', message, { options });
      return { data: null, error: 'Error fetching subjects', statusCode: 500 };
    }
  }
}
