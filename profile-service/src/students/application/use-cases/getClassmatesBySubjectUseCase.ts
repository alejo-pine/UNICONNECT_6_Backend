import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ClassmateProfile } from '../../domain/entities/classmate';
import { StudentRepositoryPort } from '../../domain/ports/studentRepositoryPort';

export class GetClassmatesBySubjectUseCase {
  constructor(private readonly studentRepository: StudentRepositoryPort) {}

  async execute(
    subjectId: string,
    currentProfileId: string
  ): Promise<ServiceResult<ClassmateProfile[]>> {
    try {
      const isEnrolled = await this.studentRepository.verifyEnrollment(currentProfileId, subjectId);

      if (!isEnrolled) {
        return {
          data: null,
          error: 'Forbidden: You are not enrolled in this subject',
          statusCode: 403,
        };
      }

      const data = await this.studentRepository.findClassmatesBySubject(subjectId, currentProfileId);
      return { data, error: null, statusCode: 200 };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching classmates';
      eventLogger.error('GetClassmatesBySubjectUseCase.execute', message, {
        subjectId,
        currentProfileId,
      });
      return { data: null, error: 'Error fetching classmates for subject', statusCode: 500 };
    }
  }
}
