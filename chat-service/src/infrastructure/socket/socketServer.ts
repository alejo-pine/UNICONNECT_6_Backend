// src/infrastructure/socket/socketServer.ts

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types/socket/index.d';
import { logger } from '../../shared/logger';
import { registerDmHandlers } from './dmHandler';
import { registerWallHandlers } from './wallHandler';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { ERROR_CODES } from '../../shared/constants';

let ioInstance: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

export function getSocketIOServer(): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!ioInstance) {
    throw new Error('Socket.IO server has not been initialized yet');
  }
  return ioInstance;
}

export function initSocketServer(
  httpServer: HttpServer,
  conversationRepo: IConversationRepository,
  groupRepo: IGroupRepository
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (ioInstance !== null) {
    return ioInstance;
  }

  const corsOriginEnv = process.env['CORS_ORIGIN'] ?? '*';
  const corsOrigin = corsOriginEnv.includes(',') ? corsOriginEnv.split(',') : corsOriginEnv;

  ioInstance = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // ── Authentication middleware ────────────────────────────────────────────────
  // Extracts x-user-id from the socket handshake auth object.
  // No JWT validation — the gateway has already authenticated the request.
  ioInstance.use((socket, next) => {
    const auth = socket.handshake.auth as Record<string, unknown>;
    const userId = auth['x-user-id'];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      logger.warn('Socket connection rejected: missing x-user-id in handshake auth', {
        socketId: socket.id,
      });
      next(
        new Error(
          JSON.stringify({
            code: ERROR_CODES.SOCKET_AUTH_MISSING,
            message: 'x-user-id is required in the handshake auth object',
          })
        )
      );
      return;
    }

    socket.data.userId = userId.trim();
    logger.info('Socket connected', { socketId: socket.id, userId: socket.data.userId });
    next();
  });

  // ── Register event handlers per connection ───────────────────────────────────
  ioInstance.on('connection', (socket) => {
    registerDmHandlers(socket, conversationRepo);
    registerWallHandlers(socket, groupRepo);

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.data.userId,
        reason,
      });
    });
  });

  logger.info('Socket.IO server initialized');
  return ioInstance;
}
