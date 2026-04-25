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
router.get('/status', asyncHandler(authStatus));

// Sync Auth0 profile with local database
router.post('/sync', requireJsonContentType, requireAuth0Jwt, asyncHandler(syncAuthProfile));

// Get authenticated user info (requires valid JWT)
router.get('/me', authMiddleware, asyncHandler(getMe));

// Logout endpoint (stateless - just confirmation)
router.post('/logout', requireJsonContentType, authMiddleware, asyncHandler(logout));

export default router;
