import { Request, Response, Router } from 'express';
import { requireAuth0Jwt } from '../middleware/auth0Jwt';
import { asyncHandler } from '../utils/controller';
import { HttpError } from '../utils/httpError';
import { syncAuthProfile, getMe, logout, authStatus } from '../interfaces/http/authController';
import authMiddleware from '../middleware/auth';

const router: Router = Router();

const requireJsonContentType = (
  req: Request,
  _res: Response,
  next: (error?: unknown) => void
): void => {
  if (!req.is('application/json')) {
    next(new HttpError(415, 'Content-Type debe ser application/json'));
    return;
  }
  next();
};

// Status endpoint (without authentication)
/**
 * @openapi
 * /auth/status:
 *   get:
 *     summary: Auth Service Status
 *     description: Returns the health status of the auth service
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Status response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
/**
 * @openapi
 * /status:
 *   get:
 *     summary: GET /status
 *     tags: [Auth]
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
router.get('/status', asyncHandler(authStatus));

// Sync Auth0 profile with local database
/**
 * @openapi
 * /auth/sync:
 *   post:
 *     summary: Sync Auth0 profile
 *     description: Syncs a newly authenticated Auth0 user to the local database
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /sync:
 *   post:
 *     summary: POST /sync
 *     tags: [Auth]
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
router.post('/sync', requireJsonContentType, requireAuth0Jwt, asyncHandler(syncAuthProfile));

// Get authenticated user info (requires valid JWT)
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user info
 *     description: Returns the profile data for the authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 displayName:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /me:
 *   get:
 *     summary: GET /me
 *     tags: [Auth]
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
router.get('/me', authMiddleware, asyncHandler(getMe));

// Logout endpoint (stateless - just confirmation)
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: Logs out the current user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /logout:
 *   post:
 *     summary: POST /logout
 *     tags: [Auth]
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
router.post('/logout', requireJsonContentType, authMiddleware, asyncHandler(logout));

export default router;
