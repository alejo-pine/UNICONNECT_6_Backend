// src/infrastructure/database/repositories/ConversationRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IConversationRepository,
} from '../../../domain/repositories/IConversationRepository';
import {
  Conversation,
  ConversationWithParticipant,
} from '../../../domain/entities/Conversation';
import { logger } from '../../../shared/logger';

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
}

interface ProfileRef {
  id: string;
  name: string;
  avatar_url: string | null;
}



function mapRowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    createdAt: new Date(row.created_at),
  };
}

export class ConversationRepository implements IConversationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findOrCreate(userA: string, userB: string): Promise<Conversation> {
    // Try to insert; if it conflicts on (pair_low, pair_high), do nothing.
    const { error: insertError } = await this.supabase
      .from('conversation')
      .insert({ user_a: userA, user_b: userB });

    if (insertError && insertError.code !== '23505') {
      // 23505 = unique_violation — expected on conflict
      logger.error('Error inserting conversation', { error: insertError.message });
      throw new Error(`Database error: ${insertError.message}`);
    }

    // Always SELECT after insert attempt to get the canonical row.
    const { data, error: selectError } = await this.supabase
      .from('conversation')
      .select('id, user_a, user_b, created_at')
      .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
      .single();

    if (selectError || !data) {
      logger.error('Error fetching conversation after upsert', {
        error: selectError?.message,
      });
      throw new Error(`Database error: ${selectError?.message ?? 'No row returned'}`);
    }

    return mapRowToConversation(data as unknown as ConversationRow);
  }

  async findById(id: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversation')
      .select('id, user_a, user_b, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching conversation by id', { id, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;
    return mapRowToConversation(data as unknown as ConversationRow);
  }

  async listByUserId(userId: string): Promise<ConversationWithParticipant[]> {
    // Step 1: fetch all conversation rows for this user (two queries to avoid
    // Supabase JS v2's .or() scoping bug when combined with joins).
    const [resA, resB] = await Promise.all([
      this.supabase
        .from('conversation')
        .select('id, user_a, user_b, created_at')
        .eq('user_a', userId)
        .order('created_at', { ascending: false }),
      this.supabase
        .from('conversation')
        .select('id, user_a, user_b, created_at')
        .eq('user_b', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (resA.error) {
      logger.error('Error listing conversations (user_a)', { userId, error: resA.error.message });
      throw new Error(`Database error: ${resA.error.message}`);
    }
    if (resB.error) {
      logger.error('Error listing conversations (user_b)', { userId, error: resB.error.message });
      throw new Error(`Database error: ${resB.error.message}`);
    }

    // Merge and de-duplicate by id, sort newest-first.
    const seen = new Set<string>();
    const rows = [...(resA.data ?? []), ...(resB.data ?? [])]
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as ConversationRow[];

    if (rows.length === 0) return [];

    // Step 2: collect the IDs of the OTHER participant for each conversation.
    const otherUserIds = [...new Set(
      rows.map((row) => (row.user_a === userId ? row.user_b : row.user_a))
    )];

    // Step 3: fetch all needed profiles in a single query.
    const { data: profiles, error: profileError } = await this.supabase
      .from('profile')
      .select('id, name, avatar_url')
      .in('id', otherUserIds);

    if (profileError) {
      logger.error('Error fetching profiles for conversations', { error: profileError.message });
      throw new Error(`Database error: ${profileError.message}`);
    }

    const profileMap = new Map<string, ProfileRef>(
      (profiles ?? []).map((p) => [p.id, p as ProfileRef])
    );

    // Step 4: map each conversation to the response shape.
    return rows.map((row) => {
      const otherUserId = row.user_a === userId ? row.user_b : row.user_a;
      const otherProfile = profileMap.get(otherUserId) ?? null;

      return {
        id: row.id,
        userA: row.user_a,
        userB: row.user_b,
        createdAt: new Date(row.created_at),
        otherParticipant: {
          id: otherProfile?.id ?? '',
          name: otherProfile?.name ?? '',
          avatarUrl: otherProfile?.avatar_url ?? null,
        },
      };
    });
  }

  async findByIdWithParticipant(
    id: string,
    currentUserId: string
  ): Promise<ConversationWithParticipant | null> {
    // Step 1: fetch the conversation row.
    const { data, error } = await this.supabase
      .from('conversation')
      .select('id, user_a, user_b, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching conversation with participant', { id, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;

    const row = data as unknown as ConversationRow;

    // Step 2: determine the other participant's ID and fetch their profile.
    const otherUserId = row.user_a === currentUserId ? row.user_b : row.user_a;

    const { data: profileData, error: profileError } = await this.supabase
      .from('profile')
      .select('id, name, avatar_url')
      .eq('id', otherUserId)
      .maybeSingle();

    if (profileError) {
      logger.error('Error fetching other participant profile', {
        otherUserId,
        error: profileError.message,
      });
      throw new Error(`Database error: ${profileError.message}`);
    }

    const otherProfile = profileData as ProfileRef | null;

    return {
      id: row.id,
      userA: row.user_a,
      userB: row.user_b,
      createdAt: new Date(row.created_at),
      otherParticipant: {
        id: otherProfile?.id ?? '',
        name: otherProfile?.name ?? '',
        avatarUrl: otherProfile?.avatar_url ?? null,
      },
    };
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('conversation')
      .select('id')
      .eq('id', conversationId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .maybeSingle();

    if (error) {
      logger.error('Error checking conversation participant', {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return data !== null;
  }
}
