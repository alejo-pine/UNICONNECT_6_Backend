// src/infrastructure/socket/dmHandler.ts

import { Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types/socket/index.d';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { ROOM_PREFIXES, SOCKET_EVENTS, ERROR_CODES } from '../../shared/constants';
import { logger } from '../../shared/logger';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerDmHandlers(
  socket: AppSocket,
  conversationRepo: IConversationRepository
): void {
  // ── dm:join ──────────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.DM_JOIN, async (payload) => {
    try {
      const { conversationId } = payload;

      if (!conversationId || typeof conversationId !== 'string') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'conversationId is required',
        });
        return;
      }

      const isParticipant = await conversationRepo.isParticipant(
        conversationId,
        socket.data.userId
      );

      if (!isParticipant) {
        logger.warn('Socket dm:join denied — not a participant', {
          socketId: socket.id,
          userId: socket.data.userId,
          conversationId,
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.SOCKET_NOT_PARTICIPANT,
          message: 'You are not a participant of this conversation',
        });
        return;
      }

      const room = `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
      await socket.join(room);
      logger.info('Socket joined DM room', {
        socketId: socket.id,
        userId: socket.data.userId,
        room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in dm:join handler', { socketId: socket.id, error: message });
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An error occurred while joining the conversation room',
      });
    }
  });

  // ── dm:leave ─────────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.DM_LEAVE, async (payload) => {
    try {
      const { conversationId } = payload;

      if (!conversationId || typeof conversationId !== 'string') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'conversationId is required',
        });
        return;
      }

      const room = `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
      await socket.leave(room);
      logger.info('Socket left DM room', {
        socketId: socket.id,
        userId: socket.data.userId,
        room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in dm:leave handler', { socketId: socket.id, error: message });
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An error occurred while leaving the conversation room',
      });
    }
  });
}
