import { Router } from 'express';
import { asyncHandler } from '../utils/controller';
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from '../interfaces/http/notificationController';

const router: Router = Router();

router.post('/', asyncHandler(createNotification));

router.get('/:userId', asyncHandler(getUserNotifications));

router.patch('/:id/read', asyncHandler(markNotificationAsRead));

export default router;
