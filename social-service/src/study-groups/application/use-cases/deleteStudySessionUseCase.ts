import { HttpError } from '../../../utils/httpError';
import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';

export class DeleteStudySessionUseCase {
  constructor(
    private readonly studySessionRepository: StudySessionRepositoryPort,
    private readonly studyGroupRepository: StudyGroupRepositoryPort
  ) {}

  async execute(groupId: string, sessionId: string, requesterId: string): Promise<void> {
    const session = await this.studySessionRepository.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'Study session not found');
    }

    if (session.groupId !== groupId) {
      throw new HttpError(400, 'Session does not belong to the specified group');
    }

    const group = await this.studyGroupRepository.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Study group not found');
    }

    // Only creator of the group (admin) can delete sessions
    if (group.creatorId !== requesterId) {
      throw new HttpError(403, 'Forbidden: only the group admin can delete sessions');
    }

    await this.studySessionRepository.deleteSession(sessionId);
  }
}
