import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from './authenticatedRequest';
import { eventLogger } from '../utils/eventLogger';

/**
 * Middleware de autorización por rol para Express.
 *
 * Equivalente al patrón NestJS: @UseGuards(AuthGuard, RolesGuard) + @Roles('super_admin')
 * Adaptado a Express como fábrica de middlewares reutilizable.
 *
 * ## Uso en rutas
 * ```typescript
 * import authMiddleware from '../middleware/auth';
 * import { requireRole } from '../middleware/requireRole';
 *
 * // Equivalente Express de @UseGuards(AuthGuard) + @Roles('super_admin')
 * router.use('/admin', authMiddleware, requireRole('super_admin'));
 * router.get('/admin/usuarios', adminController.listarUsuarios);
 * ```
 *
 * ## Garantías
 * - El rol se lee exclusivamente desde `req.user.role`, que fue extraído del JWT
 *   por `authMiddleware` → nunca se realiza una consulta adicional a BD.
 * - Si `authMiddleware` no se ejecutó antes (req.user ausente), responde 401.
 * - Si el rol no coincide, responde 403 y registra un log de nivel `warn`
 *   con userId, ruta, método y timestamp (trazabilidad de intentos denegados).
 *
 * @param requiredRole - Rol de aplicación que debe tener el usuario (ej. 'super_admin').
 * @returns Middleware de Express listo para encadenar en rutas.
 */
export const requireRole =
  (requiredRole: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    // Salvaguarda: authMiddleware debe ejecutarse antes que requireRole.
    if (!user) {
      eventLogger.warn('requireRole', 'Guard ejecutado sin usuario autenticado en req', {
        requiredRole,
        path: req.path,
        method: req.method,
      });
      res.status(401).json({ error: 'No autenticado', statusCode: 401 });
      return;
    }

    if (user.role !== requiredRole) {
      // Log de auditoría: todo intento denegado queda registrado con contexto completo.
      eventLogger.warn('requireRole', 'Acceso denegado por rol insuficiente', {
        userId: user.id,
        userRole: user.role ?? 'sin_rol',
        requiredRole,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      res.status(403).json({
        error: `Acceso restringido: se requiere rol '${requiredRole}'`,
        statusCode: 403,
      });
      return;
    }

    next();
  };
