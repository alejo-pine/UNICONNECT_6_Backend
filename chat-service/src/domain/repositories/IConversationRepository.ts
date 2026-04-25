// src/domain/repositories/IConversationRepository.ts

import { Conversation, ConversationWithParticipant } from '../entities/Conversation';

export interface IConversationRepository {
  /**
   * Creates or retrieves an existing conversation between two users.
   * Uses INSERT ... ON CONFLICT (pair_low, pair_high) DO NOTHING.
   */
  findOrCreate(userA: string, userB: string): Promise<Conversation>;

  /**
   * Retrieves a conversation by its ID.
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Retrieves a single conversation by ID with the other participant's profile data.
   */
  findByIdWithParticipant(
    id: string,
    currentUserId: string
  ): Promise<ConversationWithParticipant | null>;

  /**
   * Lists all conversations for a given user, including the other participant's profile data.
   */
  listByUserId(userId: string): Promise<ConversationWithParticipant[]>;

  /**
   * Checks whether a user is a participant (user_a or user_b) in a conversation.
   */
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
}
