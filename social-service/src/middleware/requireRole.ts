import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../shared/http/authenticatedRequest';

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole || userRole !== requiredRole) {
        res.status(403).json({
          error: `Acceso denegado. Se requiere el rol de ${requiredRole}`,
          statusCode: 403,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('[requireRole] Error de autorización:', error);
      res.status(500).json({ error: 'Error interno del servidor', statusCode: 500 });
    }
  };
};
