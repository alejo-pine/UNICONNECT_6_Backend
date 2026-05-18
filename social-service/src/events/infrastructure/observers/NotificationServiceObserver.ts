import { IUniversityObserver, UniversityEvent } from '../../domain/events/universityEvents';
import { EventSubscriptionRepositoryPort } from '../../domain/ports/eventSubscriptionRepositoryPort';

export class NotificationServiceObserver implements IUniversityObserver {
  private readonly notificationServiceUrl: string;

  constructor(private readonly eventSubscriptionRepository: EventSubscriptionRepositoryPort) {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
  }

  public async update(event: UniversityEvent): Promise<void> {
    try {
      const subscribedUsers = await this.eventSubscriptionRepository.getSubscribedUsers(event.category);
      if (subscribedUsers.length === 0) {
        return;
      }

      const promises = subscribedUsers.map((userId) => this.sendNotification(userId, event));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error(`[NotificationServiceObserver] Error in update for event ${event.eventId}:`, error);
    }
  }

  private async sendNotification(userId: string, event: UniversityEvent): Promise<void> {
    try {
      const payload = {
        recipientUserId: userId,
        title: 'Nuevo Evento Universitario',
        message: `Se ha publicado un nuevo evento en la categoría ${event.category}: ${event.title}`,
        type: 'SISTEMA', // Usamos 'SISTEMA' como dice isValidNotificationType, u otro tipo que sea compatible.
      };

      const response = await fetch(this.notificationServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `[NotificationServiceObserver] Failed to send notification to ${userId}. Status: ${response.status}`
        );
      }
    } catch (error) {
      console.error(`[NotificationServiceObserver] Error calling notification-service for user ${userId}:`, error);
    }
  }
}
