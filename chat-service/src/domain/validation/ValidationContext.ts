
export interface AttachmentInputContext {
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface ValidationContext {
  senderId: string;

  destinationType: 'dm' | 'wall';

  content?: string;

  attachments?: AttachmentInputContext[];

  conversationId?: string;

  groupId?: string;
}
