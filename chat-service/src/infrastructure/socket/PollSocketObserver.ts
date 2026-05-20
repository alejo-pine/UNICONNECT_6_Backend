// src/infrastructure/socket/PollSocketObserver.ts

import { Server as SocketIOServer } from 'socket.io';
import { IObserver } from '../../domain/observer/IObserver';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../types/socket/index.d';
import { ROOM_PREFIXES, SOCKET_EVENTS } from '../../shared/constants';
import { logger } from '../../shared/logger';

type AppIO = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class PollSocketObserver implements IObserver {
  constructor(private readonly io: AppIO) {}

  update(event: string, payload: unknown): void {
    if (
      event !== SOCKET_EVENTS.WALL_POLL_CREATED &&
      event !== SOCKET_EVENTS.WALL_POLL_VOTED &&
      event !== SOCKET_EVENTS.WALL_POLL_CLOSED
    ) {
      return;
    }

    if (event === SOCKET_EVENTS.WALL_POLL_CREATED) {
      const post = payload as any;
      if (!post.groupId) {
        logger.warn('PollSocketObserver: payload missing groupId, skipping emit', { payload });
        return;
      }
      const room = `${ROOM_PREFIXES.WALL}${post.groupId}`;
      this.io.to(room).emit('encuesta:creada', post);
      logger.info('PollSocketObserver: emitted encuesta:creada', {
        room,
        postId: post.id,
      });
    } else if (event === SOCKET_EVENTS.WALL_POLL_VOTED) {
      const data = payload as { poll: any; groupId: string };
      if (!data.groupId) {
        logger.warn('PollSocketObserver: payload missing groupId for vote, skipping emit', { payload });
        return;
      }
      const room = `${ROOM_PREFIXES.WALL}${data.groupId}`;
      this.io.to(room).emit('encuesta:votoRegistrado', data.poll);
      logger.info('PollSocketObserver: emitted encuesta:votoRegistrado', {
        room,
        pollId: data.poll.id,
      });
    } else if (event === SOCKET_EVENTS.WALL_POLL_CLOSED) {
      const data = payload as { poll: any; groupId: string };
      if (!data.groupId) {
        logger.warn('PollSocketObserver: payload missing groupId for close, skipping emit', { payload });
        return;
      }
      const room = `${ROOM_PREFIXES.WALL}${data.groupId}`;
      this.io.to(room).emit('encuesta:cerrada', data.poll);
      logger.info('PollSocketObserver: emitted encuesta:cerrada', {
        room,
        pollId: data.poll.id,
      });
    }
  }
}
