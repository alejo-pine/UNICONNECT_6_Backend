// src/infrastructure/socket/wallHandler.ts

import { Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types/socket/index.d';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { ROOM_PREFIXES, SOCKET_EVENTS, ERROR_CODES } from '../../shared/constants';
import { logger } from '../../shared/logger';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerWallHandlers(
  socket: AppSocket,
  groupRepo: IGroupRepository
): void {
  // ── wall:join ────────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.WALL_JOIN, async (payload) => {
    try {
      const { groupId } = payload;

      if (!groupId || typeof groupId !== 'string') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'groupId is required',
        });
        return;
      }

      const isMember = await groupRepo.isMember(groupId, socket.data.userId);

      if (!isMember) {
        logger.warn('Socket wall:join denied — not a member', {
          socketId: socket.id,
          userId: socket.data.userId,
          groupId,
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.SOCKET_NOT_MEMBER,
          message: 'You are not a member of this group',
        });
        return;
      }

      const room = `${ROOM_PREFIXES.WALL}${groupId}`;
      await socket.join(room);
      logger.info('Socket joined wall room', {
        socketId: socket.id,
        userId: socket.data.userId,
        room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in wall:join handler', { socketId: socket.id, error: message });
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An error occurred while joining the group wall room',
      });
    }
  });

  // ── wall:leave ───────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.WALL_LEAVE, async (payload) => {
    try {
      const { groupId } = payload;

      if (!groupId || typeof groupId !== 'string') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'groupId is required',
        });
        return;
      }

      const room = `${ROOM_PREFIXES.WALL}${groupId}`;
      await socket.leave(room);
      logger.info('Socket left wall room', {
        socketId: socket.id,
        userId: socket.data.userId,
        room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in wall:leave handler', { socketId: socket.id, error: message });
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An error occurred while leaving the group wall room',
      });
    }
  });
}
