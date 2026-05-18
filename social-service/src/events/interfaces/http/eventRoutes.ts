import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import authMiddleware from '../../../middleware/auth';
import { getEventById, getEvents, subscribe, unsubscribe, createEvent, getSubscriptions } from './eventController';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';

const router: Router = Router();

router.get('/', asyncHandler((req, res) => getEvents(req as AuthenticatedRequest, res)));
router.post('/', authMiddleware, asyncHandler((req, res) => createEvent(req as AuthenticatedRequest, res)));
router.get('/suscripciones', authMiddleware, asyncHandler((req, res) => getSubscriptions(req as AuthenticatedRequest, res)));
router.post('/suscribir', authMiddleware, asyncHandler((req, res) => subscribe(req as AuthenticatedRequest, res)));
router.delete('/suscribir', authMiddleware, asyncHandler((req, res) => unsubscribe(req as AuthenticatedRequest, res)));
router.get('/:id', asyncHandler((req, res) => getEventById(req as AuthenticatedRequest, res)));

export default router;
