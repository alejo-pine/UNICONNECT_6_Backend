// src/shared/middlewares/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ModerationError } from '../errors/ModerationError';
import { logger } from '../logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ModerationError) {
    logger.warn('Moderation error', {
      code: err.code,
      moderationCode: err.moderationCode,
      message: err.message,
      escalated: err.escalated,
      path: req.path,
    });

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      moderationCode: err.moderationCode,
      escalated: err.escalated,
      ruleExplanation: err.ruleExplanation,
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational AppError', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    } else {
      logger.warn('Operational error', {
        code: err.code,
        message: err.message,
        path: req.path,
      });
    }

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown / unexpected errors
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled error', { message, stack, path: req.path });

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An internal server error occurred',
  });
}
