import { Response } from 'express';
import { HttpError } from './httpError';
import { eventLogger } from './eventLogger';

/**
 * Helper to handle common error scenarios in study group controllers.
 * Prevents repetitive error handling code across multiple endpoints.
 */
export const handleControllerError = (
  err: unknown,
  res: Response,
  scope: string,
  context?: Record<string, unknown>
): void => {
  const message = err instanceof Error ? err.message : 'Unknown error';

  eventLogger.error(scope, message, context);

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};
