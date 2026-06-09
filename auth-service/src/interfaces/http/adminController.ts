import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticatedRequest';
import supabase from '../../utils/supabaseClient';

/**
 * Controlador base para rutas administrativas (US-EV01).
 *
 * Estos handlers NUNCA verifican el rol por sí mismos.
 * La autorización por `super_admin` la garantiza la cadena de middlewares
 * `authMiddleware → requireRole('super_admin')` aplicada en adminRoutes.ts.
 *
 * Equivalencia con NestJS:
 *   @Controller('admin') + @UseGuards(AuthGuard, RolesGuard) + @Roles('super_admin')
 *   → En Express: la cadena de middlewares en el router sustituye a los decoradores.
 */

/**
 * GET /admin/status
 * Endpoint de diagnóstico que confirma que el guardia de EV01 está activo.
 * Solo alcanzable si el JWT porta role='super_admin'.
 */
export const adminStatus = (req: Request, res: Response): void => {
  const user = (req as AuthenticatedRequest).user;

  res.status(200).json({
    status: 'ok',
    service: 'auth-service',
    admin: true,
    userId: user.id,
    role: user.role,
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /admin/moderation-history
 * Endpoint para obtener el historial completo de moderación del chat.
 * Exclusivo para super_admin.
 */
export const getModerationHistory = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('moderation_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Admin] Error fetching moderation history:', error);
    res.status(500).json({ error: 'Error al obtener el historial de moderación' });
    return;
  }

  res.status(200).json(data);
};
