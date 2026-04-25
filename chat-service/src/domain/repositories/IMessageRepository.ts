// src/domain/repositories/IMessageRepository.ts

import { Message, MessageAttachment, CreateMessageInput } from '../entities/Message';

export interface PaginationCursor {
  limit: number;
  before?: string;
}

export interface IMessageRepository {
  /**
   * Creates a message and its attachments atomically.
   */
  create(input: CreateMessageInput): Promise<Message>;

  /**
   * Returns paginated messages for a conversation using cursor-based pagination.
   */
  listByConversation(conversationId: string, pagination: PaginationCursor): Promise<Message[]>;

  /**
   * Finds an attachment by its ID.
   */
  findAttachmentById(attachmentId: string): Promise<
    (MessageAttachment & { storagePath: string; bucket: string }) | null
  >;

  /**
   * Returns the conversationId for a given messageId, or null if not found.
   * Used to verify access when fetching attachment signed URLs.
   */
  findConversationIdByMessageId(messageId: string): Promise<string | null>;
}
