import { supabase } from '../../utils/supabaseClient';
import { EventSubscriptionRepositoryPort } from '../domain/ports/eventSubscriptionRepositoryPort';

export class SupabaseEventSubscriptionRepository implements EventSubscriptionRepositoryPort {
  private readonly TABLE_NAME = 'event_subscriptions';

  async subscribe(userId: string, category: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .upsert({ user_id: userId, category: category }, { onConflict: 'user_id,category' });

    if (error) {
      throw new Error(`Error subscribing to category: ${error.message}`);
    }
  }

  async unsubscribe(userId: string, category: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .match({ user_id: userId, category: category });

    if (error) {
      throw new Error(`Error unsubscribing from category: ${error.message}`);
    }
  }

  async getSubscribedUsers(category: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('user_id')
      .eq('category', category);

    if (error) {
      throw new Error(`Error fetching subscribed users: ${error.message}`);
    }

    return (data || []).map((row: any) => row.user_id);
  }

  async getUserSubscriptions(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('category')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching user subscriptions: ${error.message}`);
    }

    return (data || []).map((row: any) => row.category as string);
  }
}
