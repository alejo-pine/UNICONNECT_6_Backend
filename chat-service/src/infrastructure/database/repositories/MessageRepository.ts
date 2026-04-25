// src/infrastructure/database/repositories/MessageRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IMessageRepository, PaginationCursor } from '../../../domain/repositories/IMessageRepository';
import { Message, MessageAttachment, CreateMessageInput } from '../../../domain/entities/Message';
import { logger } from '../../../shared/logger';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../../shared/constants';

interface AttachmentRow {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  bucket: string;
  storage_path: string;
  uploaded_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  direct_message_attachment: AttachmentRow[];
}

function mapAttachmentRow(row: AttachmentRow): MessageAttachment {
  return {
    id: row.id,
    messageId: row.message_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    uploadedAt: new Date(row.uploaded_at),
  };
}

function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    attachments: (row.direct_message_attachment ?? []).map(mapAttachmentRow),
    createdAt: new Date(row.created_at),
  };
}

export class MessageRepository implements IMessageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateMessageInput): Promise<Message> {
    // Insert message
    const { data: msgData, error: msgError } = await this.supabase
      .from('direct_message')
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content ?? null,
      })
      .select('id, conversation_id, sender_id, content, created_at')
      .single();

    if (msgError || !msgData) {
      logger.error('Error inserting message', { error: msgError?.message });
      throw new Error(`Database error: ${msgError?.message ?? 'No row returned'}`);
    }

    const messageId = (msgData as { id: string }).id;
    const attachments: MessageAttachment[] = [];

    // Insert attachments if any
    if (input.attachments && input.attachments.length > 0) {
      const attachmentRows = input.attachments.map((a) => ({
        message_id: messageId,
        file_name: a.fileName,
        file_type: a.fileType,
        file_size: a.fileSize,
        storage_path: a.storagePath,
        bucket: 'dm-attachments',
      }));

      const { data: attData, error: attError } = await this.supabase
        .from('direct_message_attachment')
        .insert(attachmentRows)
        .select('id, message_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at');

      if (attError || !attData) {
        logger.error('Error inserting message attachments', { error: attError?.message });
        throw new Error(`Database error: ${attError?.message ?? 'No attachment rows returned'}`);
      }

      for (const row of attData as AttachmentRow[]) {
        attachments.push(mapAttachmentRow(row));
      }
    }

    const rawMsg = msgData as {
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string | null;
      created_at: string;
    };

    return {
      id: rawMsg.id,
      conversationId: rawMsg.conversation_id,
      senderId: rawMsg.sender_id,
      content: rawMsg.content,
      attachments,
      createdAt: new Date(rawMsg.created_at),
    };
  }

  async listByConversation(
    conversationId: string,
    pagination: PaginationCursor
  ): Promise<Message[]> {
    const limit = Math.min(
      pagination.limit > 0 ? pagination.limit : DEFAULT_PAGE_LIMIT,
      MAX_PAGE_LIMIT
    );

    let query = this.supabase
      .from('direct_message')
      .select(
        'id, conversation_id, sender_id, content, created_at, direct_message_attachment(id, message_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at)'
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pagination.before) {
      // Cursor: get messages older than the message with the given id
      const { data: cursorRow, error: cursorError } = await this.supabase
        .from('direct_message')
        .select('created_at')
        .eq('id', pagination.before)
        .single();

      if (cursorError || !cursorRow) {
        logger.warn('Cursor message not found', { before: pagination.before });
        throw new Error('Invalid cursor: message not found');
      }

      const cursorTimestamp = (cursorRow as { created_at: string }).created_at;
      query = query.lt('created_at', cursorTimestamp);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error listing messages', { conversationId, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as MessageRow[]).map(mapMessageRow);
  }

  async findAttachmentById(
    attachmentId: string
  ): Promise<(MessageAttachment & { storagePath: string; bucket: string }) | null> {
    const { data, error } = await this.supabase
      .from('direct_message_attachment')
      .select('id, message_id, file_name, file_type, file_size, bucket, storage_path, uploaded_at')
      .eq('id', attachmentId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching dm attachment', { attachmentId, error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;

    const row = data as AttachmentRow;
    return {
      id: row.id,
      messageId: row.message_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      storagePath: row.storage_path,
      bucket: row.bucket,
      uploadedAt: new Date(row.uploaded_at),
    };
  }

  async findConversationIdByMessageId(messageId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('direct_message')
      .select('conversation_id')
      .eq('id', messageId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching conversation_id by message_id', {
        messageId,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) return null;
    return (data as { conversation_id: string }).conversation_id;
  }
}
