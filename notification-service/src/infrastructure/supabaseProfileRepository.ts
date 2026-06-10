import supabase from '../utils/supabaseClient';
import { ProfileRepositoryPort } from '../domain/ports/profileRepositoryPort';
import { eventLogger } from '../utils/eventLogger';

export class SupabaseProfileRepository implements ProfileRepositoryPort {
  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) {
        eventLogger.error('SupabaseProfileRepository', `Error fetching email for user ${userId}: ${error.message}`);
        return null;
      }

      return data?.email || null;
    } catch (error: any) {
      eventLogger.error('SupabaseProfileRepository', `Unexpected error fetching email: ${error.message}`);
      return null;
    }
  }
}
