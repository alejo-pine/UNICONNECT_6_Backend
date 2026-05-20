import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { eventLogger } from '../../../utils/eventLogger';
import { supabase } from '../../../utils/supabaseClient';

export class SessionAttendanceObserver {
  constructor(
    private readonly sessionRepository: StudySessionRepositoryPort,
    private readonly groupRepository: StudyGroupRepositoryPort
  ) {}

  async onAttendanceUpdated(sessionId: string, userId: string, status: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) return;

      const group = await this.groupRepository.findById(session.groupId);
      if (!group) return;

      // Only notify if the user updating is NOT the organizer
      // Wait, if the session has a specific creator, we should notify the session creator, but currently it falls back to group creator if not available.
      // group.creatorId is the group admin. session.creatorId might be the session organizer.
      const organizerId = session.creatorId || group.creatorId;
      if (organizerId === userId) return;

      // Fetch user profile name
      let userName = 'Un participante';
      const { data: profile } = await supabase.from('profile').select('name').eq('id', userId).maybeSingle();
      if (profile && profile.name) {
        userName = profile.name;
      }

      // Reutiliza NotificacionService (Criterio 6 & 7)
      const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
      
      const statusText = status === 'attending' ? 'asistirá a' : (status === 'declined' ? 'ha declinado' : 'está pendiente para');
      
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: organizerId,
          title: `Actualización de asistencia`,
          message: `${userName} ${statusText} la sesión "${session.name}".`,
          type: 'EVENTO_GRUPO',
          groupId: group.id,
        }),
      });

      if (!response.ok) {
        eventLogger.error('SessionAttendanceObserver', `Error notificando al organizador ${organizerId}`, await response.text().catch(()=>''));
      } else {
        eventLogger.info('SessionAttendanceObserver', `Notificación enviada al organizador ${organizerId} sobre sesión ${sessionId}`, {});
      }
    } catch (error) {
      eventLogger.error('SessionAttendanceObserver', 'Failed to process attendance update event', error);
    }
  }
}
