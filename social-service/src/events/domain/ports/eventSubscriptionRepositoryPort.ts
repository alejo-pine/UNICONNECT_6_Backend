export interface EventSubscriptionRepositoryPort {
  subscribe(userId: string, category: string): Promise<void>;
  unsubscribe(userId: string, category: string): Promise<void>;
  getSubscribedUsers(category: string): Promise<string[]>;
  getUserSubscriptions(userId: string): Promise<string[]>;
}
