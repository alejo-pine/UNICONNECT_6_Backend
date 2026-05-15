import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Notification } from '../domain/entities/notification';
import { eventLogger } from '../utils/eventLogger';

let io: SocketIOServer | null = null;

export const initSocketIO = (httpServer: HttpServer, corsOrigins: string[]): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string | undefined;

    if (!userId) {
      eventLogger.warn('SocketIO', 'Conexión rechazada: userId no proporcionado');
      socket.disconnect(true);
      return;
    }

    void socket.join(`user:${userId}`);
    eventLogger.info('SocketIO', `Usuario conectado: ${userId}`, { socketId: socket.id });

    socket.on('disconnect', () => {
      eventLogger.info('SocketIO', `Usuario desconectado: ${userId}`, { socketId: socket.id });
    });
  });

  eventLogger.info('SocketIO', 'Socket.io inicializado');
  return io;
};

export const emitNotification = (notification: Notification): void => {
  if (!io) {
    eventLogger.warn('SocketIO', 'Socket.io no inicializado, omitiendo emisión');
    return;
  }

  io.to(`user:${notification.recipientUserId}`).emit('notification:new', {
    id: notification.id,
    recipientUserId: notification.recipientUserId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  });

  eventLogger.info('SocketIO', `notification:new emitido`, {
    room: `user:${notification.recipientUserId}`,
    notificationId: notification.id,
  });
};

export const getIO = (): SocketIOServer | null => io;
