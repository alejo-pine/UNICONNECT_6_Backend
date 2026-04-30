import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { eventLogger } from '../../utils/eventLogger';
import { StudyGroupRepositoryPort } from '../../study-groups/domain/ports/studyGroupRepositoryPort';
import {
  STUDY_GROUP_JOIN_EVENT,
  STUDY_GROUP_LEAVE_EVENT,
  STUDY_GROUP_ROOM_PREFIX,
  STUDY_GROUP_UPDATED_EVENT,
  STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT,
  STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT,
  STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT,
  studyGroupRealtimeBus,
  StudyGroupUpdatedPayload,
  StudyGroupUpdatedSocketPayload,
  AdminTransferEventPayload,
} from '../../realtime/studyGroupRealtime';

type StudyGroupSocket = Socket;

let ioInstance: SocketIOServer | null = null;
let isObserverRegistered = false;

const getRoomName = (groupId: string): string => `${STUDY_GROUP_ROOM_PREFIX}${groupId}`;
const getUserRoomName = (userId: string): string => `user:${userId}`;

const getUserIdFromSocket = (socket: StudyGroupSocket): string => {
  const userId = socket.data?.userId;
  return typeof userId === 'string' ? userId.trim() : '';
};

const emitStudyGroupUpdate = (payload: StudyGroupUpdatedPayload): void => {
  if (!ioInstance) {
    return;
  }

  // Flatten the payload: send members/pendingRequests at root level
  // so the frontend can consume them without drilling into updatedGroup.
  const socketPayload: StudyGroupUpdatedSocketPayload = {
    groupId: payload.groupId,
    action: payload.action,
    members: payload.updatedGroup.members ?? [],
    pendingRequests: payload.updatedGroup.pendingRequests ?? [],
    createdBy: payload.updatedGroup.createdBy,
    timestamp: payload.timestamp,
  };

  ioInstance.to(getRoomName(payload.groupId)).emit(STUDY_GROUP_UPDATED_EVENT, socketPayload);
};

const emitAdminTransferEvent = (eventName: string, payload: AdminTransferEventPayload): void => {
  if (!ioInstance) {
    return;
  }

  // Emit to the group room (covers the admin who initiated + any member already on that page)
  ioInstance.to(getRoomName(payload.groupId)).emit(eventName, payload);

  // Emit to the candidate's personal room so the notification arrives
  // even if they are not currently viewing that specific group page.
  if (payload.toUserId.trim()) {
    ioInstance.to(getUserRoomName(payload.toUserId)).emit(eventName, payload);
  }
};

export const initStudyGroupSocketServer = (
  httpServer: HttpServer,
  studyGroupRepository: StudyGroupRepositoryPort
): SocketIOServer => {
  if (ioInstance) {
    return ioInstance;
  }

  const corsOrigin = process.env['CORS_ORIGIN'] ?? '*';

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use((socket, next) => {
    const auth = socket.handshake.auth as Record<string, unknown>;
    const userId = auth['x-user-id'];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      next(new Error('x-user-id is required in the handshake auth object'));
      return;
    }

    socket.data.userId = userId.trim();
    next();
  });

  ioInstance.on('connection', async (socket) => {
    // Auto-join the socket to a personal room so the backend can always
    // target this user directly via ioInstance.to(`user:<userId>`).
    const connectedUserId = getUserIdFromSocket(socket);
    if (connectedUserId) {
      await socket.join(getUserRoomName(connectedUserId));
      eventLogger.info('StudyGroupSocketServer', 'Socket joined personal user room', {
        socketId: socket.id,
        userId: connectedUserId,
        room: getUserRoomName(connectedUserId),
      });
    }

    socket.on(STUDY_GROUP_JOIN_EVENT, async (payload: { groupId?: string }) => {
      try {
        const groupId = typeof payload?.groupId === 'string' ? payload.groupId.trim() : '';
        const userId = getUserIdFromSocket(socket);

        if (!groupId) {
          socket.emit('error', { message: 'groupId is required' });
          return;
        }

        if (!userId) {
          socket.emit('error', { message: 'x-user-id is required' });
          return;
        }

        const isMember = await studyGroupRepository.isMember(userId, groupId);
        if (!isMember) {
          socket.emit('error', { message: 'You are not authorized to join this study group room' });
          return;
        }

        await socket.join(getRoomName(groupId));
        eventLogger.info('StudyGroupSocketServer', 'Socket joined study group room', {
          socketId: socket.id,
          userId,
          groupId,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        eventLogger.error('StudyGroupSocketServer', 'Error in study-group:join handler', {
          socketId: socket.id,
          error: message,
        });
        socket.emit('error', { message: 'An error occurred while joining the study group room' });
      }
    });

    socket.on(STUDY_GROUP_LEAVE_EVENT, async (payload: { groupId?: string }) => {
      try {
        const groupId = typeof payload?.groupId === 'string' ? payload.groupId.trim() : '';

        if (!groupId) {
          socket.emit('error', { message: 'groupId is required' });
          return;
        }

        await socket.leave(getRoomName(groupId));
        eventLogger.info('StudyGroupSocketServer', 'Socket left study group room', {
          socketId: socket.id,
          userId: getUserIdFromSocket(socket),
          groupId,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        eventLogger.error('StudyGroupSocketServer', 'Error in study-group:leave handler', {
          socketId: socket.id,
          error: message,
        });
        socket.emit('error', { message: 'An error occurred while leaving the study group room' });
      }
    });

    socket.on('disconnect', (reason) => {
      eventLogger.info('StudyGroupSocketServer', 'Socket disconnected', {
        socketId: socket.id,
        userId: getUserIdFromSocket(socket),
        reason,
      });
    });
  });

  if (!isObserverRegistered) {
    studyGroupRealtimeBus.on(STUDY_GROUP_UPDATED_EVENT, emitStudyGroupUpdate);
    
    studyGroupRealtimeBus.on(STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT, (payload: AdminTransferEventPayload) => {
      emitAdminTransferEvent(STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT, payload);
    });
    
    studyGroupRealtimeBus.on(STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT, (payload: AdminTransferEventPayload) => {
      emitAdminTransferEvent(STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT, payload);
    });
    
    studyGroupRealtimeBus.on(STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT, (payload: AdminTransferEventPayload) => {
      emitAdminTransferEvent(STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT, payload);
    });
    
    isObserverRegistered = true;
  }

  eventLogger.info('StudyGroupSocketServer', 'Study group Socket.IO server initialized');
  return ioInstance;
};