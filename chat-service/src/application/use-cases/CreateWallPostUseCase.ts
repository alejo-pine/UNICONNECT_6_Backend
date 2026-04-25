// src/application/use-cases/CreateWallPostUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { WallPost, CreateWallAttachmentInput } from '../../domain/entities/WallPost';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../shared/constants';

export interface CreateWallPostInput {
  groupId: string;
  senderId: string;
  content?: string;
  attachments?: CreateWallAttachmentInput[];
}

export class CreateWallPostUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: CreateWallPostInput): Promise<WallPost> {
    const isMember = await this.groupRepo.isMember(input.groupId, input.senderId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const hasContent = input.content !== undefined && input.content.trim().length > 0;
    const hasAttachments = input.attachments !== undefined && input.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      throw new ValidationError('Post must have content or at least one attachment');
    }

    if (hasAttachments) {
      this.validateAttachments(input.attachments!);
    }

    return this.wallPostRepo.create({
      groupId: input.groupId,
      senderId: input.senderId,
      content: hasContent ? input.content!.trim() : undefined,
      attachments: input.attachments,
    });
  }

  private validateAttachments(attachments: CreateWallAttachmentInput[]): void {
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
