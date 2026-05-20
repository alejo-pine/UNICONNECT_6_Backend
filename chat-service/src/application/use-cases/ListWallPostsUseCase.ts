// src/application/use-cases/ListWallPostsUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { WallPost } from '../../domain/entities/WallPost';
import { PaginationCursor } from '../../domain/repositories/IMessageRepository';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { DEFAULT_PAGE_LIMIT } from '../../shared/constants';

export class ListWallPostsUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(
    userId: string,
    groupId: string,
    limit: number = DEFAULT_PAGE_LIMIT,
    before?: string
  ): Promise<WallPost[]> {
    const isMember = await this.groupRepo.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const pagination: PaginationCursor = { limit, before };
    return this.wallPostRepo.listByGroup(groupId, pagination, userId);
  }
}
