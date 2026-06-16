// src/infrastructure/http/controllers/WallPostController.ts

import { Request, Response, NextFunction } from 'express';
import { ListWallPostsUseCase } from '../../../application/use-cases/ListWallPostsUseCase';
import { CreateWallPostUseCase } from '../../../application/use-cases/CreateWallPostUseCase';
import { ListWallInboxUseCase } from '../../../application/use-cases/ListWallInboxUseCase';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { CreateWallAttachmentInput } from '../../../domain/entities/WallPost';
import { DEFAULT_PAGE_LIMIT } from '../../../shared/constants';
import { SOCKET_EVENTS } from '../../../shared/constants';
import { ISubject } from '../../../domain/observer/ISubject';
import { WallNewPostPayload } from '../../../types/socket/index.d';
import { MensajeBase } from '../../../domain/mensaje/MensajeBase';
import { ArchivoAdjuntoDecorator } from '../../../domain/mensaje/ArchivoAdjuntoDecorator';
import { MencionDecorator } from '../../../domain/mensaje/MencionDecorator';

export class WallPostController {
  constructor(
    private readonly listWallPosts: ListWallPostsUseCase,
    private readonly createWallPost: CreateWallPostUseCase,
    private readonly listWallInbox: ListWallInboxUseCase,
    /** Subject del patrón Observer — notifica a todos los observers suscritos (ej. WallSocketObserver). */
    private readonly chatSubject: ISubject
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

      // ── Patrón Decorator: enriquecer el payload antes de notificar ──────────
      // 1. Base: payload crudo serializado
      const rawPayload: Record<string, unknown> = {
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

      // 2. ArchivoAdjuntoDecorator: normaliza el array de adjuntos
      const conAdjuntos = new ArchivoAdjuntoDecorator(
        new MensajeBase(rawPayload),
        post.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
        }))
      );

      // 3. MencionDecorator: extrae @menciones del content y agrega campo mentions[]
      const conMenciones = new MencionDecorator(conAdjuntos);

      // El payload final ya está decorado
      const enrichedPayload = conMenciones.getPayload();

      // ── Patrón Observer: notifica a los observers suscritos (WallSocketObserver) ───
      this.chatSubject.notify(SOCKET_EVENTS.WALL_NEW_POST, enrichedPayload);

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
