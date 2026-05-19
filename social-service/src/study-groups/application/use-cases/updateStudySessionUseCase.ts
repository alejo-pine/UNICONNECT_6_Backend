import { HttpError } from '../../../utils/httpError';
import { StudySession, UpdateStudySessionInput } from '../../domain/entities/studySession';
import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';

export interface UpdateSessionCommand {
  sessionId: string;
  updaterId: string;
  updateMode: 'single' | 'future';
  updates: UpdateStudySessionInput;
}

export class UpdateStudySessionUseCase {
  constructor(
    private readonly studySessionRepository: StudySessionRepositoryPort,
    private readonly studyGroupRepository: StudyGroupRepositoryPort
  ) {}

  async execute(command: UpdateSessionCommand): Promise<StudySession[]> {
    const session = await this.studySessionRepository.findById(command.sessionId);
    if (!session) {
      throw new HttpError(404, 'Study session not found');
    }

    const group = await this.studyGroupRepository.findById(session.groupId);
    if (!group) {
      throw new HttpError(404, 'Study group not found');
    }

    if (group.creatorId !== command.updaterId) {
      throw new HttpError(403, 'Forbidden: only the group admin can update sessions');
    }

    if (command.updates.startTime && command.updates.endTime) {
      const start = new Date(command.updates.startTime);
      const end = new Date(command.updates.endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        throw new HttpError(400, 'Invalid start or end time');
      }
    }

    if (command.updateMode === 'future' && session.seriesId) {
      // Update this instance and all future instances in the series.
      // Note: updating times across a series is complex because dates change.
      // So we usually only update name/description in bulk, or recreate future instances.
      // For simplicity here, we only support updating name/description for the series.
      if (command.updates.startTime || command.updates.endTime) {
        throw new HttpError(400, 'Updating times for an entire series is not supported. Please recreate the series or update instances individually.');
      }

      return await this.studySessionRepository.updateSeriesFrom(
        session.seriesId,
        session.startTime,
        command.updates
      );
    } else {
      // Update only this single instance
      const updated = await this.studySessionRepository.updateSession(command.sessionId, command.updates);
      return [updated];
    }
  }
}
