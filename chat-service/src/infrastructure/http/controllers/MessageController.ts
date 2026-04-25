// src/infrastructure/http/controllers/MessageController.ts

import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { ListMessagesUseCase } from '../../../application/use-cases/ListMessagesUseCase';
import { SendMessageUseCase } from '../../../application/use-cases/SendMessageUseCase';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { IConversationRepository } from '../../../domain/repositories/IConversationRepository';
import { CreateAttachmentInput } from '../../../domain/entities/Message';
import {
  ROOM_PREFIXES,
  SOCKET_EVENTS,
  DEFAULT_PAGE_LIMIT,
} from '../../../shared/constants';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DmNewMessagePayload,
} from '../../../types/socket/index.d';

export class MessageController {
  constructor(
    private readonly listMessages: ListMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
    private readonly conversationRepo: IConversationRepository,
    private readonly io: SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ) {}

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: conversationId } = req.params as { id: string };
      const rawLimit = req.query['limit'];
      const before = req.query['before'];

      const limit =
        rawLimit !== undefined && typeof rawLimit === 'string' && rawLimit.trim() !== ''
          ? parseInt(rawLimit, 10)
          : DEFAULT_PAGE_LIMIT;

      if (isNaN(limit) || limit < 1) {
        throw new ValidationError('limit must be a positive integer');
      }

      const cursorBefore =
        before !== undefined && typeof before === 'string' && before.trim() !== ''
          ? before.trim()
          : undefined;

      const messages = await this.listMessages.execute(
        req.userId,
        conversationId,
        limit,
        cursorBefore
      );

      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  };

  postMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: conversationId } = req.params as { id: string };

      // Verify conversation exists
      const conversation = await this.conversationRepo.findById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation');
      }

      const body = req.body as {
        content?: unknown;
        attachments?: unknown;
      };

      const content =
        body.content !== undefined && typeof body.content === 'string'
          ? body.content
          : undefined;

      const attachments = this.parseAttachments(body.attachments);

      const message = await this.sendMessage.execute({
        conversationId,
        senderId: req.userId,
        content,
        attachments,
      });

      // Emit real-time event to all participants in the room
      const payload: DmNewMessagePayload = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        attachments: message.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
        })),
        createdAt: message.createdAt.toISOString(),
      };

      this.io
        .to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`)
        .emit(SOCKET_EVENTS.DM_NEW_MESSAGE, payload);

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  };

  private parseAttachments(raw: unknown): CreateAttachmentInput[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    if (raw.length === 0) return undefined;

    return raw.map((item: unknown, index: number) => {
      if (typeof item !== 'object' || item === null) {
        throw new ValidationError(`Attachment at index ${index} must be an object`);
      }

      const obj = item as Record<string, unknown>;

      if (typeof obj['fileName'] !== 'string' || obj['fileName'].trim() === '') {
        throw new ValidationError(`Attachment[${index}].fileName is required`);
      }
      if (typeof obj['fileType'] !== 'string' || obj['fileType'].trim() === '') {
        throw new ValidationError(`Attachment[${index}].fileType is required`);
      }
      if (typeof obj['fileSize'] !== 'number' || obj['fileSize'] <= 0) {
        throw new ValidationError(`Attachment[${index}].fileSize must be a positive number`);
      }
      if (typeof obj['storagePath'] !== 'string' || obj['storagePath'].trim() === '') {
        throw new ValidationError(`Attachment[${index}].storagePath is required`);
      }

      return {
        fileName: (obj['fileName'] as string).trim(),
        fileType: (obj['fileType'] as string).trim(),
        fileSize: obj['fileSize'] as number,
        storagePath: (obj['storagePath'] as string).trim(),
      };
    });
  }
}
