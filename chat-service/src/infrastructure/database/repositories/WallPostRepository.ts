// src/infrastructure/database/repositories/WallPostRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IWallPostRepository } from '../../../domain/repositories/IWallPostRepository';
import { WallPost, WallPostAttachment, CreateWallPostInput } from '../../../domain/entities/WallPost';
import { PaginationCursor } from '../../../domain/repositories/IMessageRepository';
import { logger } from '../../../shared/logger';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../../shared/constants';

interface WallAttachmentRow {
  id: string;
  post_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  bucket: string;
  storage_path: string;
  uploaded_at: string;
}

interface WallPostRow {
  id: string;
  group_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  wall_post_attachment: WallAttachmentRow[];
  profile?: unknown;
  poll?: any;
}

function mapAttachmentRow(row: WallAttachmentRow): WallPostAttachment {
  return {
    id: row.id,
    postId: row.post_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    uploadedAt: new Date(row.uploaded_at),
  };
}

function mapWallPostRow(row: WallPostRow, userId?: string): WallPost {
  const profileData = row.profile as any;
  const profile = Array.isArray(profileData) ? profileData[0] : profileData;

  let poll: any = undefined;
  const pollDataArray = row.poll;
  const pollData = Array.isArray(pollDataArray) ? pollDataArray[0] : pollDataArray;
  
  if (pollData) {
    const totalVotes = pollData.poll_vote ? pollData.poll_vote.length : 0;
    const options = (pollData.poll_option || []).map((opt: any) => {
      const votesCount = pollData.poll_vote
        ? pollData.poll_vote.filter((v: any) => v.option_id === opt.id).length
        : 0;
      const percentage = totalVotes === 0 ? 0 : Math.round((votesCount / totalVotes) * 100);
      return {
        id: opt.id,
        optionText: opt.option_text,
        votesCount,
        percentage,
      };
    });

    let userVotedOptionId: string | null = null;
    if (userId && pollData.poll_vote) {
      const userVote = pollData.poll_vote.find((v: any) => v.user_id === userId);
      if (userVote) {
        userVotedOptionId = userVote.option_id;
      }
    }

    poll = {
      id: pollData.id,
      postId: row.id,
      question: pollData.question,
      expiresAt: new Date(pollData.expires_at),
      closed: pollData.closed,
      createdAt: new Date(pollData.created_at),
      options,
      userVotedOptionId,
    };
  }

  return {
    id: row.id,
    groupId: row.group_id,
    senderId: row.sender_id,
    senderName: profile?.name ?? 'Unknown User',
    avatarUrl: profile?.avatar_url ?? null,
    content: row.content,
    attachments: (row.wall_post_attachment ?? []).map(mapAttachmentRow),
    createdAt: new Date(row.created_at),
    poll,
  };
}

export class WallPostRepository implements IWallPostRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateWallPostInput): Promise<WallPost> {
    const { data: postData, error: postError } = await this.supabase
      .from('wall_post')
      .insert({
        group_id: input.groupId,
        sender_id: input.senderId,
        content: input.content ?? null,
      })
      .select('id, group_id, sender_id, content, created_at')
      .single();

    if (postError || !postData) {
      logger.error('Error inserting wall post', { error: postError?.message });
      throw new Error(`Database error: ${postError?.message ?? 'No row returned'}`);
    }

    const postId = (postData as { id: string }).id;
    const attachments: WallPostAttachment[] = [];

    if (input.attachments && input.attachments.length > 0) {
      const attachmentRows = input.attachments.map((a) => ({
        post_id: postId,
        file_name: a.fileName,
        file_type: a.fileType,
        file_size: a.fileSize,
        storage_path: a.storagePath,
        bucket: 'wall-attachments',
      }));

      const { data: attData, error: attError } = await this.supabase
        .from('wall_post_attachment')
        .insert(attachmentRows)
        .select('id, post_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at');

      if (attError || !attData) {
        logger.error('Error inserting wall post attachments', { error: attError?.message });
        throw new Error(`Database error: ${attError?.message ?? 'No attachment rows returned'}`);
      }

      for (const row of attData as WallAttachmentRow[]) {
        attachments.push(mapAttachmentRow(row));
      }
    }

    const rawPost = postData as {
      id: string;
      group_id: string;
      sender_id: string;
      content: string | null;
      created_at: string;
    };

    const { data: profileData } = await this.supabase
      .from('profile')
      .select('name, avatar_url')
      .eq('id', input.senderId)
      .maybeSingle();

    const senderName = profileData?.name ?? 'Unknown User';
    const avatarUrl = profileData?.avatar_url ?? null;

    return {
      id: rawPost.id,
      groupId: rawPost.group_id,
      senderId: rawPost.sender_id,
      senderName,
      avatarUrl,
      content: rawPost.content,
      attachments,
      createdAt: new Date(rawPost.created_at),
    };
  }

  async listByGroup(groupId: string, pagination: PaginationCursor, userId?: string): Promise<WallPost[]> {
    const limit = Math.min(
      pagination.limit > 0 ? pagination.limit : DEFAULT_PAGE_LIMIT,
      MAX_PAGE_LIMIT
    );

    let query = this.supabase
      .from('wall_post')
      .select(
        'id, group_id, sender_id, content, created_at, wall_post_attachment(id, post_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at), profile(name, avatar_url), poll(id, question, expires_at, closed, created_at, poll_option(id, option_text), poll_vote(option_id, user_id))'
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pagination.before) {
      const { data: cursorRow, error: cursorError } = await this.supabase
        .from('wall_post')
        .select('created_at')
        .eq('id', pagination.before)
        .single();

      if (cursorError || !cursorRow) {
        logger.warn('Cursor post not found', { before: pagination.before });
        throw new Error('Invalid cursor: post not found');
      }

      const cursorTimestamp = (cursorRow as { created_at: string }).created_at;
      query = query.lt('created_at', cursorTimestamp);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error listing wall posts', { groupId, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as WallPostRow[]).map((row) => mapWallPostRow(row, userId));
  }

  async findAttachmentById(
    attachmentId: string
  ): Promise<(WallPostAttachment & { storagePath: string; bucket: string }) | null> {
    const { data, error } = await this.supabase
      .from('wall_post_attachment')
      .select('id, post_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at')
      .eq('id', attachmentId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching wall attachment', { attachmentId, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;

    const row = data as WallAttachmentRow;
    return {
      id: row.id,
      postId: row.post_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      storagePath: row.storage_path,
      bucket: row.bucket,
      uploadedAt: new Date(row.uploaded_at),
    };
  }

  async findGroupIdByPostId(postId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('wall_post')
      .select('group_id')
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching group_id by post_id', {
        postId,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;
    return (data as { group_id: string }).group_id;
  }
}
