// src/domain/entities/WallPost.ts

export interface WallPostAttachment {
  id: string;
  postId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface WallPost {
  id: string;
  groupId: string;
  senderId: string;
  content: string | null;
  attachments: WallPostAttachment[];
  createdAt: Date;
}

export interface CreateWallAttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface CreateWallPostInput {
  groupId: string;
  senderId: string;
  content?: string;
  attachments?: CreateWallAttachmentInput[];
}
