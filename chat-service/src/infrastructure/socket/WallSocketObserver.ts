// src/infrastructure/socket/WallSocketObserver.ts
// Observer concreto que escucha el evento 'wall:new_post' y lo retransmite
// a todos los clientes Socket.IO conectados a la sala del grupo correspondiente.
// Vive en infrastructure/ porque conoce la dependencia de Socket.IO.

import { Server as SocketIOServer } from 'socket.io';
import { IObserver } from '../../domain/observer/IObserver';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  WallNewPostPayload,
} from '../../types/socket/index.d';
import { ROOM_PREFIXES, SOCKET_EVENTS } from '../../shared/constants';
import { logger } from '../../shared/logger';

type AppIO = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class WallSocketObserver implements IObserver {
  constructor(private readonly io: AppIO) {}

  update(event: string, payload: unknown): void {
    if (event !== SOCKET_EVENTS.WALL_NEW_POST) {
      // Este observer sólo reacciona al evento de nuevo post en el muro.
      return;
    }

    // El payload viene tipado desde WallPostController como WallNewPostPayload.
    const post = payload as WallNewPostPayload;

    if (!post.groupId) {
      logger.warn('WallSocketObserver: payload missing groupId, skipping emit', { payload });
      return;
    }

    const room = `${ROOM_PREFIXES.WALL}${post.groupId}`;

    this.io.to(room).emit(SOCKET_EVENTS.WALL_NEW_POST, post);

    logger.info('WallSocketObserver: emitted wall:new_post', {
      room,
      postId: post.id,
      groupId: post.groupId,
    });
  }
}
