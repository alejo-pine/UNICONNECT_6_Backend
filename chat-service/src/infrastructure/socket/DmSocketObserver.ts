// src/infrastructure/socket/DmSocketObserver.ts
// Observer concreto para el canal de mensajes directos (DM).
// Análogo a WallSocketObserver pero actúa sobre la sala "conversation:<id>"
// y emite el evento 'dm:new_message'.
// Es una instancia INDEPENDIENTE: no comparte Subject ni estado con el Wall.

import { Server as SocketIOServer } from 'socket.io';
import { IObserver } from '../../domain/observer/IObserver';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DmNewMessagePayload,
} from '../../types/socket/index.d';
import { ROOM_PREFIXES, SOCKET_EVENTS } from '../../shared/constants';
import { logger } from '../../shared/logger';

type AppIO = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class DmSocketObserver implements IObserver {
  constructor(private readonly io: AppIO) {}

  update(event: string, payload: unknown): void {
    if (event !== SOCKET_EVENTS.DM_NEW_MESSAGE) {
      // Este observer sólo reacciona al evento de nuevo mensaje privado.
      return;
    }

    const message = payload as DmNewMessagePayload;

    if (!message.conversationId) {
      logger.warn('DmSocketObserver: payload missing conversationId, skipping emit', { payload });
      return;
    }

    const room = `${ROOM_PREFIXES.CONVERSATION}${message.conversationId}`;

    this.io.to(room).emit(SOCKET_EVENTS.DM_NEW_MESSAGE, message);

    logger.info('DmSocketObserver: emitted dm:new_message', {
      room,
      messageId: message.id,
      conversationId: message.conversationId,
    });
  }
}
