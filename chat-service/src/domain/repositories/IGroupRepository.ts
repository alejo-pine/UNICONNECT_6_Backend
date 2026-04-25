// src/domain/repositories/IGroupRepository.ts

export interface IGroupRepository {
  /**
   * Checks if a user is a member of a study group.
   */
  isMember(groupId: string, profileId: string): Promise<boolean>;
}
