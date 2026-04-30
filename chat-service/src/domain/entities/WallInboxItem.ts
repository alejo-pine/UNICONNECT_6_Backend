// src/domain/entities/WallInboxItem.ts

export interface WallInboxItem {
  groupId: string;
  groupName: string;
  lastPost: {
    id: string;
    senderId: string;
    senderName: string;
    content: string | null;
    createdAt: Date;
  } | null;
}
