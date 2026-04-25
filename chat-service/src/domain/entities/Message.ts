// src/domain/entities/Message.ts

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments: MessageAttachment[];
  createdAt: Date;
}

export interface CreateAttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: CreateAttachmentInput[];
}
