// src/infrastructure/database/repositories/GroupRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IGroupRepository } from '../../../domain/repositories/IGroupRepository';
import { logger } from '../../../shared/logger';

export class GroupRepository implements IGroupRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async isMember(groupId: string, profileId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('group_member')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking group membership', {
        groupId,
        profileId,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return data !== null;
  }
}
