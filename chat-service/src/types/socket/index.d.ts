// src/types/socket/index.d.ts
// Socket.IO typed events for the communication microservice

export interface DmNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
}

export interface WallNewPostPayload {
  id: string;
  groupId: string;
  senderId: string;
  content: string | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}

export interface ServerToClientEvents {
  'dm:new_message': (payload: DmNewMessagePayload) => void;
  'wall:new_post': (payload: WallNewPostPayload) => void;
  error: (payload: SocketErrorPayload) => void;
}

export interface ClientToServerEvents {
  'dm:join': (payload: { conversationId: string }) => void;
  'dm:leave': (payload: { conversationId: string }) => void;
  'wall:join': (payload: { groupId: string }) => void;
  'wall:leave': (payload: { groupId: string }) => void;
}

export interface InterServerEvents {
  // No inter-server events (no Redis)
}

export interface SocketData {
  userId: string;
}
