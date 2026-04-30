// src/infrastructure/http/controllers/WallPostController.ts

import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { ListWallPostsUseCase } from '../../../application/use-cases/ListWallPostsUseCase';
import { CreateWallPostUseCase } from '../../../application/use-cases/CreateWallPostUseCase';
import { ListWallInboxUseCase } from '../../../application/use-cases/ListWallInboxUseCase';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { CreateWallAttachmentInput } from '../../../domain/entities/WallPost';
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
  WallNewPostPayload,
} from '../../../types/socket/index.d';

export class WallPostController {
  constructor(
    private readonly listWallPosts: ListWallPostsUseCase,
    private readonly createWallPost: CreateWallPostUseCase,
    private readonly listWallInbox: ListWallInboxUseCase,
    private readonly io: SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ) {}

  getWallInbox = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inbox = await this.listWallInbox.execute(req.userId);
      res.status(200).json(inbox);
    } catch (error) {
      next(error);
    }
  };

  getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params as { groupId: string };
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

      const posts = await this.listWallPosts.execute(req.userId, groupId, limit, cursorBefore);
      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  };

  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params as { groupId: string };

      const body = req.body as {
        content?: unknown;
        attachments?: unknown;
      };

      const content =
        body.content !== undefined && typeof body.content === 'string'
          ? body.content
          : undefined;

      const attachments = this.parseAttachments(body.attachments);

      const post = await this.createWallPost.execute({
        groupId,
        senderId: req.userId,
        content,
        attachments,
      });

      // Emit real-time event to all members in the room
      const payload: WallNewPostPayload = {
        id: post.id,
        groupId: post.groupId,
        senderId: post.senderId,
        senderName: post.senderName,
        avatarUrl: post.avatarUrl,
        content: post.content,
        attachments: post.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
        })),
        createdAt: post.createdAt.toISOString(),
      };

      this.io
        .to(`${ROOM_PREFIXES.WALL}${groupId}`)
        .emit(SOCKET_EVENTS.WALL_NEW_POST, payload);

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  };

  private parseAttachments(raw: unknown): CreateWallAttachmentInput[] | undefined {
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
