// src/infrastructure/database/repositories/GroupRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IGroupRepository } from '../../../domain/repositories/IGroupRepository';
import { WallInboxItem } from '../../../domain/entities/WallInboxItem';
import { logger } from '../../../shared/logger';

export class GroupRepository implements IGroupRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async isMember(groupId: string, profileId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('group_member')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking group membership', {
        groupId,
        profileId,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return data !== null;
  }

  async listWallInbox(userId: string): Promise<WallInboxItem[]> {
    // 1. Fetch groups where user is a member
    const { data: memberGroups, error: memberError } = await this.supabase
      .from('group_member')
      .select('group_id, study_group(name)')
      .eq('profile_id', userId);

    if (memberError) {
      logger.error('Error fetching member groups for wall inbox', { userId, error: memberError.message });
      throw new Error(`Database error: ${memberError.message}`);
    }

    if (!memberGroups || memberGroups.length === 0) return [];

    const groupsInfo = memberGroups.map(row => {
      const groupData = row.study_group as any;
      const groupName = Array.isArray(groupData) ? groupData[0]?.name : groupData?.name;
      return {
        groupId: row.group_id as string,
        groupName: groupName ?? 'Unknown Group',
      };
    });

    // 2. Fetch latest post for each group
    const latestPostsPromises = groupsInfo.map(async (g) => {
      const { data, error } = await this.supabase
        .from('wall_post')
        .select('id, sender_id, content, created_at')
        .eq('group_id', g.groupId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.warn('Error fetching latest post for group', { groupId: g.groupId, error: error.message });
      }

      return { groupId: g.groupId, post: data };
    });

    const latestPostsResults = await Promise.all(latestPostsPromises);

    // 3. Extract sender IDs and fetch profiles
    const senderIds = new Set<string>();
    latestPostsResults.forEach(r => {
      if (r.post && r.post.sender_id) senderIds.add(r.post.sender_id);
    });

    const profileMap = new Map<string, string>();
    if (senderIds.size > 0) {
      const { data: profiles, error: profileError } = await this.supabase
        .from('profile')
        .select('id, name')
        .in('id', Array.from(senderIds));

      if (profileError) {
        logger.error('Error fetching sender profiles', { error: profileError.message });
        throw new Error(`Database error: ${profileError.message}`);
      }

      (profiles || []).forEach((p: any) => profileMap.set(p.id, p.name));
    }

    // 4. Map everything together
    const inboxItems: WallInboxItem[] = groupsInfo.map(g => {
      const postResult = latestPostsResults.find(r => r.groupId === g.groupId)?.post;

      let lastPost = null;
      if (postResult) {
        lastPost = {
          id: postResult.id,
          senderId: postResult.sender_id,
          senderName: profileMap.get(postResult.sender_id) ?? 'Unknown User',
          content: postResult.content,
          createdAt: new Date(postResult.created_at)
        };
      }

      return {
        groupId: g.groupId,
        groupName: g.groupName,
        lastPost
      };
    });

    // 5. Sort: items with posts first (sorted by createdAt desc), then items without posts
    inboxItems.sort((a, b) => {
      if (a.lastPost && b.lastPost) {
        return b.lastPost.createdAt.getTime() - a.lastPost.createdAt.getTime();
      }
      if (a.lastPost && !b.lastPost) return -1;
      if (!a.lastPost && b.lastPost) return 1;
      return 0;
    });

    return inboxItems;
  }
}
