import { HttpError } from '../../../utils/httpError';
import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';
import { SessionAttendanceObserver } from '../../infrastructure/observers/SessionAttendanceObserver';

export class UpdateSessionAttendanceUseCase {
  constructor(
    private readonly studySessionRepository: StudySessionRepositoryPort,
    private readonly observer: SessionAttendanceObserver
  ) {}

  async execute(groupId: string, sessionId: string, userId: string, status: 'attending' | 'declined' | 'pending'): Promise<void> {
    const session = await this.studySessionRepository.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'Study session not found');
    }

    if (session.groupId !== groupId) {
      throw new HttpError(400, 'Session does not belong to the specified group');
    }

    // Guardar en la base de datos
    await this.studySessionRepository.upsertAttendance(sessionId, userId, status);

    // Emitir evento al observer (Criterio 7)
    // No esperamos a que termine para no bloquear la respuesta
    this.observer.onAttendanceUpdated(sessionId, userId, status).catch(console.error);
  }
}
