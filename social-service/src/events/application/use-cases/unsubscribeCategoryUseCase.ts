import { EventSubscriptionRepositoryPort } from '../../domain/ports/eventSubscriptionRepositoryPort';

export class UnsubscribeCategoryUseCase {
  constructor(private readonly eventSubscriptionRepository: EventSubscriptionRepositoryPort) {}

  async execute(userId: string, category: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !category) {
      return { success: false, error: 'userId and category are required' };
    }

    try {
      await this.eventSubscriptionRepository.unsubscribe(userId, category);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
