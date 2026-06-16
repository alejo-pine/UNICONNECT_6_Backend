import { StudySession } from '../../domain/entities/studySession';
import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';

export class GetStudySessionsUseCase {
  constructor(private readonly studySessionRepository: StudySessionRepositoryPort) {}

  async execute(groupId: string): Promise<StudySession[]> {
    return await this.studySessionRepository.findByGroupId(groupId);
  }
}
