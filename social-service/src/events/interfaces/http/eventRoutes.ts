import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import { getEventById, getEvents } from './eventController';

const router: Router = Router();

router.get('/', asyncHandler(getEvents));
router.get('/:id', asyncHandler(getEventById));

export default router;
