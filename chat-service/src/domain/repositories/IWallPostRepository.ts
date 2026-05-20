// src/domain/repositories/IWallPostRepository.ts

import { WallPost, WallPostAttachment, CreateWallPostInput } from '../entities/WallPost';
import { PaginationCursor } from './IMessageRepository';

export interface IWallPostRepository {
  /**
   * Creates a wall post and its attachments atomically.
   */
  create(input: CreateWallPostInput): Promise<WallPost>;

  /**
   * Returns paginated wall posts for a group using cursor-based pagination.
   */
  listByGroup(groupId: string, pagination: PaginationCursor, userId?: string): Promise<WallPost[]>;

  /**
   * Finds a wall post attachment by its ID.
   */
  findAttachmentById(attachmentId: string): Promise<
    (WallPostAttachment & { storagePath: string; bucket: string }) | null
  >;

  /**
   * Returns the groupId for a given postId, or null if not found.
   * Used to verify group membership when fetching attachment signed URLs.
   */
  findGroupIdByPostId(postId: string): Promise<string | null>;
}
