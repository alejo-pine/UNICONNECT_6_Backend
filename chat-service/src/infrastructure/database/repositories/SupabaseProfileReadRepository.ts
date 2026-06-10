import { SupabaseClient } from '@supabase/supabase-js';
import { IProfileReadRepository } from '../../../domain/repositories/IProfileReadRepository';
import { logger } from '../../../shared/logger';

export class SupabaseProfileReadRepository implements IProfileReadRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching user role from profile', { userId, error: error.message });
      return null;
    }

    return data?.role ?? null;
  }
}
