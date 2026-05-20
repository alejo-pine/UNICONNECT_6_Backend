import { StudySessionRepositoryPort } from '../domain/ports/studySessionRepositoryPort';
import { StudyGroupRepositoryPort } from '../domain/ports/studyGroupRepositoryPort';
import { eventLogger } from '../../utils/eventLogger';

export class StudySessionCronNotifier {
  private intervalId?: NodeJS.Timeout;
  private notifiedSessions = new Set<string>();

  constructor(
    private readonly sessionRepository: StudySessionRepositoryPort,
    private readonly groupRepository: StudyGroupRepositoryPort,
    private readonly checkIntervalMs: number = 60000,
    private readonly notifyMinutesBefore: number = 15
  ) {}

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndNotify();
      } catch (error) {
        eventLogger.error('StudySessionCronNotifier.checkAndNotify', 'Error during cron run', error);
      }
    }, this.checkIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkAndNotify() {
    const upcomingSessions = await this.sessionRepository.findUpcomingSessions(this.notifyMinutesBefore);

    const now = new Date();
    const targetMs = this.notifyMinutesBefore * 60 * 1000;
    const windowMs = 90 * 1000; // ±90 second tolerance to survive cron scheduling drift

    eventLogger.info(
      'StudySessionCronNotifier.checkAndNotify',
      `Cron ejecutado. Sesiones en ventana [${this.notifyMinutesBefore}min ±90s]: ${upcomingSessions.length}`,
      { count: upcomingSessions.length, notifyMinutesBefore: this.notifyMinutesBefore }
    );

    for (const session of upcomingSessions) {
      try {
        const startTime = new Date(session.startTime);
        const diffMs = startTime.getTime() - now.getTime();

        if (diffMs >= targetMs - windowMs && diffMs <= targetMs + windowMs) {
          if (!this.notifiedSessions.has(session.id)) {
            this.notifiedSessions.add(session.id);
            await this.notifyGroupMembers(session);
            
            // Clean up the set after 5 minutes to prevent memory leak
            setTimeout(() => {
              this.notifiedSessions.delete(session.id);
            }, 5 * 60 * 1000);
          }
        }
      } catch (err) {
        eventLogger.error('StudySessionCronNotifier.notifyGroupMembers', `Error notifying for session ${session.id}`, err);
      }
    }
  }

  private async notifyGroupMembers(session: any) {
    const groupMembers = await this.groupRepository.findMembers(session.groupId);
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';

    eventLogger.info(
      'StudySessionCronNotifier.notifyGroupMembers',
      `Notificando ${groupMembers.length} miembro(s) para sesión "${session.name}" (${session.id})`,
      { sessionId: session.id, groupId: session.groupId, members: groupMembers.length }
    );

    for (const member of groupMembers) {
      try {
        const response = await fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientUserId: member.id,                           // ← campo correcto
            title: `📅 Sesión en ${this.notifyMinutesBefore} minutos`,
            message: `La sesión "${session.name}" está por comenzar.${session.location ? ` 📍 ${session.location}` : ''}`,
            type: 'EVENTO_GRUPO',
            groupId: session.groupId,
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          eventLogger.error(
            'StudySessionCronNotifier',
            `notification-service respondió ${response.status} para usuario ${member.id}`,
            { body }
          );
        } else {
          eventLogger.info(
            'StudySessionCronNotifier',
            `Notificación enviada a usuario ${member.id}`,
            { sessionId: session.id }
          );
        }
      } catch (err) {
        eventLogger.error('StudySessionCronNotifier', `Error de red al notificar a ${member.id}`, err);
      }
    }
  }
}
