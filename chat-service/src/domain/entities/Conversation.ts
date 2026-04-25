// src/domain/entities/Conversation.ts

export interface Conversation {
  id: string;
  userA: string;
  userB: string;
  createdAt: Date;
}

export interface ConversationWithParticipant extends Conversation {
  otherParticipant: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}
