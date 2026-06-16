// src/domain/repositories/IGroupRepository.ts

export interface IGroupRepository {
  /**
   * Returns a list of groups the user is a member of, along with the latest wall post.
   */
  listWallInbox(userId: string): Promise<import('../entities/WallInboxItem').WallInboxItem[]>;

  /**
   * Checks if a user is a member of a study group.
   */
  isMember(groupId: string, profileId: string): Promise<boolean>;
}
