// src/application/use-cases/GetDmAttachmentUrlUseCase.ts

import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { SIGNED_URL_EXPIRY_SECONDS } from '../../shared/constants';

export class GetDmAttachmentUrlUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly storageRepo: IStorageRepository
  ) {}

  async execute(attachmentId: string, userId: string): Promise<string> {
    const attachment = await this.messageRepo.findAttachmentById(attachmentId);

    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    // Resolve the conversation that owns this message to verify access
    const conversationId = await this.messageRepo.findConversationIdByMessageId(
      attachment.messageId
    );

    if (!conversationId) {
      throw new NotFoundError('Message for attachment');
    }

    const isParticipant = await this.conversationRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('You do not have access to this attachment');
    }

    return this.storageRepo.createSignedUrl(
      attachment.bucket,
      attachment.storagePath,
      SIGNED_URL_EXPIRY_SECONDS
    );
  }
}
