// src/application/use-cases/GetWallAttachmentUrlUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { SIGNED_URL_EXPIRY_SECONDS } from '../../shared/constants';

export class GetWallAttachmentUrlUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly groupRepo: IGroupRepository,
    private readonly storageRepo: IStorageRepository
  ) {}

  async execute(attachmentId: string, userId: string): Promise<string> {
    const attachment = await this.wallPostRepo.findAttachmentById(attachmentId);

    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    // The attachment carries postId; we need the groupId from the wall_post.
    // We resolve it via a new method on the wall post repo.
    const groupId = await this.wallPostRepo.findGroupIdByPostId(attachment.postId);

    if (!groupId) {
      throw new NotFoundError('Post for attachment');
    }

    const isMember = await this.groupRepo.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You do not have access to this attachment');
    }

    return this.storageRepo.createSignedUrl(
      attachment.bucket,
      attachment.storagePath,
      SIGNED_URL_EXPIRY_SECONDS
    );
  }
}
