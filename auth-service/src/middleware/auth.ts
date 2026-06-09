import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from './authenticatedRequest';
import { env } from '../config/env';
import { AuthError, extractBearerToken, verifyAccessToken } from '../utils/jwtAuth';

const sendError = (res: Response, statusCode: number, error: string): void => {
  res.status(statusCode).json({ error, statusCode });
};

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const claims = verifyAccessToken(token);

    const allowedDomain: string = env.allowedDomain.toLowerCase();

    if (!claims.email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      sendError(res, 403, 'Acceso restringido a correos institucionales');
      return;
    }

    (req as AuthenticatedRequest).user = { id: claims.sub, email: claims.email, role: claims.role };

    next();
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      sendError(res, error.statusCode, error.message);
      return;
    }

    console.error('[auth] Error inesperado:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};

export default authMiddleware;
