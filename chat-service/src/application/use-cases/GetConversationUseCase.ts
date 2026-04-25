// src/application/use-cases/GetConversationUseCase.ts

import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { ConversationWithParticipant } from '../../domain/entities/Conversation';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';

export class GetConversationUseCase {
  constructor(private readonly conversationRepo: IConversationRepository) {}

  async execute(
    conversationId: string,
    currentUserId: string
  ): Promise<ConversationWithParticipant> {
    // 1. Verify the conversation exists.
    const plain = await this.conversationRepo.findById(conversationId);
    if (!plain) {
      throw new NotFoundError(`Conversation ${conversationId} not found`);
    }

    // 2. Verify the requester is a participant.
    const isParticipant = await this.conversationRepo.isParticipant(
      conversationId,
      currentUserId
    );
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    // 3. Return the conversation with the other participant's profile data.
    // findByIdWithParticipant is safe to call here because we already confirmed existence.
    const result = await this.conversationRepo.findByIdWithParticipant(
      conversationId,
      currentUserId
    );

    // Narrow the type — result cannot be null at this point.
    return result!;
  }
}
