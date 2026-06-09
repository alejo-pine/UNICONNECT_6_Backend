import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { asyncHandler } from '../utils/controller';
import { adminStatus, getModerationHistory } from '../interfaces/http/adminController';

const router: Router = Router();

/**
 * Guardia de administración — US-EV01
 *
 * Equivalencia con NestJS:
 *   @UseGuards(AuthGuard('jwt'), RolesGuard)
 *   @Roles('super_admin')
 *
 * En Express se expresa como una cadena de middlewares aplicada al router completo:
 *   authMiddleware  →  valida el JWT y puebla req.user (incluye req.user.role)
 *   requireRole     →  verifica que req.user.role === 'super_admin'; si no: HTTP 403
 *
 * Cualquier handler registrado en este router hereda la protección automáticamente,
 * sin necesidad de añadir lógica de autorización dentro de los controladores.
 */
router.use(authMiddleware, requireRole('super_admin'));

// ── Rutas administrativas ──────────────────────────────────────────────────

/**
 * @openapi
 * /admin/status:
 *   get:
 *     summary: Estado del servicio (admin)
 *     description: >
 *       Endpoint de diagnóstico protegido. Solo accesible con JWT que porte
 *       role='super_admin'. Confirma que el guardia US-EV01 está operativo.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso permitido — usuario es super_admin
 *       401:
 *         description: Token ausente o inválido
 *       403:
 *         description: Acceso restringido a super_admin
 */
router.get('/status', asyncHandler(adminStatus));

/**
 * @openapi
 * /admin/moderation-history:
 *   get:
 *     summary: Historial de moderación del chat
 *     description: >
 *       Obtiene el registro completo de la tabla moderation_history.
 *       Exclusivo para super_admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista del historial de moderación
 *       401:
 *         description: Token ausente o inválido
 *       403:
 *         description: Acceso restringido a super_admin
 */
router.get('/moderation-history', asyncHandler(getModerationHistory));

export default router;
