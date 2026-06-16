import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import authMiddleware from '../../../middleware/auth';
import { getEventById, getEvents, subscribe, unsubscribe, createEvent, getSubscriptions, registerToEvent, cancelRegistration } from './eventController';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';

const router: Router = Router();

// ... (existing routes are preserved, just replacing the import and adding at the bottom)
// To do this cleanly, I will replace the import at line 4 and then append the routes at the end.

/**
 * @openapi
 * /:
 *   get:
 *     summary: GET /
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/', asyncHandler((req, res) => getEvents(req as AuthenticatedRequest, res)));
/**
 * @openapi
 * /:
 *   post:
 *     summary: POST /
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', authMiddleware, asyncHandler((req, res) => createEvent(req as AuthenticatedRequest, res)));
/**
 * @openapi
 * /suscripciones:
 *   get:
 *     summary: GET /suscripciones
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/suscripciones', authMiddleware, asyncHandler((req, res) => getSubscriptions(req as AuthenticatedRequest, res)));
/**
 * @openapi
 * /suscribir:
 *   post:
 *     summary: POST /suscribir
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/suscribir', authMiddleware, asyncHandler((req, res) => subscribe(req as AuthenticatedRequest, res)));
/**
 * @openapi
 * /suscribir:
 *   delete:
 *     summary: DELETE /suscribir
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/suscribir', authMiddleware, asyncHandler((req, res) => unsubscribe(req as AuthenticatedRequest, res)));
/**
 * @openapi
 * /{id}:
 *   get:
 *     summary: GET /{id}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
/**
 * @openapi
 * /{id}:
 *   get:
 *     summary: GET /{id}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', authMiddleware, asyncHandler((req, res) => getEventById(req as AuthenticatedRequest, res)));

/**
 * @openapi
 * /{id}/register:
 *   post:
 *     summary: POST /{id}/register
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro exitoso
 *       409:
 *         description: Cupo agotado
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/:id/register', authMiddleware, asyncHandler((req, res) => registerToEvent(req as AuthenticatedRequest, res)));

/**
 * @openapi
 * /{id}/register:
 *   delete:
 *     summary: DELETE /{id}/register
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancelación exitosa
 *       400:
 *         description: Política de cancelación (faltan menos de 24h)
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id/register', authMiddleware, asyncHandler((req, res) => cancelRegistration(req as AuthenticatedRequest, res)));

export default router;
