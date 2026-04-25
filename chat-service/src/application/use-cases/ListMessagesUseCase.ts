// src/application/use-cases/ListMessagesUseCase.ts

import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IMessageRepository, PaginationCursor } from '../../domain/repositories/IMessageRepository';
import { Message } from '../../domain/entities/Message';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { DEFAULT_PAGE_LIMIT } from '../../shared/constants';

export class ListMessagesUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository
  ) {}

  async execute(
    userId: string,
    conversationId: string,
    limit: number = DEFAULT_PAGE_LIMIT,
    before?: string
  ): Promise<Message[]> {
    const isParticipant = await this.conversationRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    const pagination: PaginationCursor = { limit, before };
    return this.messageRepo.listByConversation(conversationId, pagination);
  }
}
