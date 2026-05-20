// src/shared/constants.ts

export const BUCKETS = {
  DM_ATTACHMENTS: 'dm-attachments',
  WALL_ATTACHMENTS: 'wall-attachments',
} as const;

export const ROOM_PREFIXES = {
  CONVERSATION: 'conversation:',
  WALL: 'wall:',
} as const;

export const SOCKET_EVENTS = {
  // Client → Server
  DM_JOIN: 'dm:join',
  DM_LEAVE: 'dm:leave',
  WALL_JOIN: 'wall:join',
  WALL_LEAVE: 'wall:leave',
  // Server → Client
  DM_NEW_MESSAGE: 'dm:new_message',
  WALL_NEW_POST: 'wall:new_post',
  // Polls (US-V04)
  WALL_POLL_CREATED: 'encuesta:creada',
  WALL_POLL_VOTED: 'encuesta:votoRegistrado',
  WALL_POLL_CLOSED: 'encuesta:cerrada',
  ERROR: 'error',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SOCKET_AUTH_MISSING: 'SOCKET_AUTH_MISSING',
  SOCKET_NOT_PARTICIPANT: 'SOCKET_NOT_PARTICIPANT',
  SOCKET_NOT_MEMBER: 'SOCKET_NOT_MEMBER',
} as const;

export const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

export const MAX_FILE_SIZE_BYTES = 20_971_520; // 20 MB

export const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
