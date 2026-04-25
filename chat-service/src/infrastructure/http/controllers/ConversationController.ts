// src/infrastructure/http/controllers/ConversationController.ts

import { Request, Response, NextFunction } from 'express';
import { ListConversationsUseCase } from '../../../application/use-cases/ListConversationsUseCase';
import { FindOrCreateConversationUseCase } from '../../../application/use-cases/FindOrCreateConversationUseCase';
import { GetConversationUseCase } from '../../../application/use-cases/GetConversationUseCase';
import { ValidationError } from '../../../shared/errors/ValidationError';

export class ConversationController {
  constructor(
    private readonly listConversations: ListConversationsUseCase,
    private readonly findOrCreateConversation: FindOrCreateConversationUseCase,
    private readonly getConversation: GetConversationUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversations = await this.listConversations.execute(req.userId);
      res.status(200).json(conversations);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetUserId } = req.body as { targetUserId?: unknown };

      if (!targetUserId || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
        throw new ValidationError('targetUserId is required and must be a non-empty string');
      }

      const conversation = await this.findOrCreateConversation.execute(
        req.userId,
        targetUserId.trim()
      );

      res.status(200).json(conversation);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const conversation = await this.getConversation.execute(id, req.userId);

      res.status(200).json(conversation);
    } catch (error) {
      next(error);
    }
  };
}
