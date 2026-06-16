// src/application/use-cases/ListWallInboxUseCase.ts

import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { WallInboxItem } from '../../domain/entities/WallInboxItem';

export class ListWallInboxUseCase {
  constructor(private readonly groupRepo: IGroupRepository) {}

  async execute(userId: string): Promise<WallInboxItem[]> {
    return this.groupRepo.listWallInbox(userId);
  }
}
