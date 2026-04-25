// src/application/use-cases/SendMessageUseCase.ts

import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { Message, CreateMessageInput, CreateAttachmentInput } from '../../domain/entities/Message';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../shared/constants';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: CreateAttachmentInput[];
}

export class SendMessageUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const isParticipant = await this.conversationRepo.isParticipant(
      input.conversationId,
      input.senderId
    );

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    const hasContent = input.content !== undefined && input.content.trim().length > 0;
    const hasAttachments = input.attachments !== undefined && input.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      throw new ValidationError('Message must have content or at least one attachment');
    }

    if (hasAttachments) {
      this.validateAttachments(input.attachments!);
    }

    const createInput: CreateMessageInput = {
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: hasContent ? input.content!.trim() : undefined,
      attachments: input.attachments,
    };

    return this.messageRepo.create(createInput);
  }

  private validateAttachments(attachments: CreateAttachmentInput[]): void {
    for (const attachment of attachments) {
      if (!ALLOWED_MIME_TYPES.includes(attachment.fileType)) {
        throw new ValidationError(`File type not allowed: ${attachment.fileType}`);
      }

      if (attachment.fileSize > MAX_FILE_SIZE_BYTES) {
        throw new ValidationError(
          `File "${attachment.fileName}" exceeds the maximum allowed size of 20 MB`
        );
      }

      if (!attachment.storagePath || attachment.storagePath.trim() === '') {
        throw new ValidationError(`Storage path is required for attachment "${attachment.fileName}"`);
      }
    }
  }
}
