// src/application/use-cases/FindOrCreateConversationUseCase.ts

import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { ConversationWithParticipant } from '../../domain/entities/Conversation';
import { ValidationError } from '../../shared/errors/ValidationError';

export class FindOrCreateConversationUseCase {
  constructor(private readonly conversationRepo: IConversationRepository) {}

  async execute(
    currentUserId: string,
    targetUserId: string
  ): Promise<ConversationWithParticipant> {
    if (currentUserId === targetUserId) {
      throw new ValidationError('Cannot create a conversation with yourself');
    }

    const conversation = await this.conversationRepo.findOrCreate(currentUserId, targetUserId);

    // Fetch the single row with the joined profile data.
    const found = await this.conversationRepo.findByIdWithParticipant(
      conversation.id,
      currentUserId
    );

    if (!found) {
      // Fallback: return a minimal representation without full profile data.
      return {
        ...conversation,
        otherParticipant: {
          id: targetUserId,
          name: '',
          avatarUrl: null,
        },
      };
    }

    return found;
  }
}
