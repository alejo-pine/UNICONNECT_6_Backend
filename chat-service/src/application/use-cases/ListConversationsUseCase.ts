// src/application/use-cases/ListConversationsUseCase.ts

import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { ConversationWithParticipant } from '../../domain/entities/Conversation';

export class ListConversationsUseCase {
  constructor(private readonly conversationRepo: IConversationRepository) {}

  async execute(userId: string): Promise<ConversationWithParticipant[]> {
    return this.conversationRepo.listByUserId(userId);
  }
}
