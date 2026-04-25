// src/shared/middlewares/extractUserId.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function extractUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'];

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    logger.warn('Missing or invalid x-user-id header', { path: req.path });
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing required header: x-user-id',
    });
    return;
  }

  req.userId = userId.trim();
  next();
}
