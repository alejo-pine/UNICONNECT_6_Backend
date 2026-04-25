import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../shared/http/authenticatedRequest';
import { env } from '../config/env';

interface JwtPayload {
  sub: string;
  email?: string;
  aud?: string;
}

/**
 * Middleware de autenticación para profile-service
 * Valida el JWT emitido por auth-service usando la clave secreta compartida
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Token de autenticacion requerido',
        statusCode: 401 
      });
      return;
    }

    // Extraer el JWT del header
    const token = authHeader.slice(7);

    if (!token) {
      res.status(401).json({ 
        error: 'Token de autenticacion requerido',
        statusCode: 401 
      });
      return;
    }

    // Validar el JWT usando la clave secreta de Supabase (misma que usa auth-service)
    try {
      const decoded = jwt.verify(token, env.supabaseJwtSecret, {
        algorithms: ['HS256'],
        issuer: env.backendPublicUrl ?? 'uniconnect-backend',
        audience: 'uniconnect-mobile',
      }) as JwtPayload;

      // Extraer ID del usuario del JWT
      if (!decoded.sub) {
        res.status(401).json({ 
          error: 'Token inválido: sin ID de usuario',
          statusCode: 401 
        });
        return;
      }

      (req as AuthenticatedRequest).user = {
        id: decoded.sub,
        email: decoded.email || '',
      };

      next();
    } catch (verifyError: unknown) {
      // Logs detallados para debugging
      if (verifyError instanceof jwt.JsonWebTokenError) {
        console.error('[auth] JWT validation error:', {
          name: verifyError.name,
          message: verifyError.message,
          expectedIssuer: env.backendPublicUrl ?? 'uniconnect-backend',
          expectedAudience: 'uniconnect-mobile',
          expectedAlgorithm: 'HS256'
        });
      } else if (verifyError instanceof jwt.TokenExpiredError) {
        console.error('[auth] Token expired:', verifyError.expiredAt);
      }
      
      throw verifyError;
    }
  } catch (error: unknown) {
    const message = error instanceof jwt.JsonWebTokenError 
      ? 'Token inválido o expirado'
      : error instanceof jwt.TokenExpiredError
      ? 'Token expirado'
      : 'Error al validar token';

    console.error('[auth] Error de validación:', error);
    res.status(401).json({ 
      error: message,
      statusCode: 401 
    });
  }
};

export default authMiddleware;
