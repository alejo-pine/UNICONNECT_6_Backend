import { Router } from 'express';
import { asyncHandler } from '../utils/controller';
import {
  createNotification,
  getMyNotifications,
  getUserNotifications,
  markNotificationAsRead,
} from '../interfaces/http/notificationController';

const router: Router = Router();

router.post('/', asyncHandler(createNotification));

// GET /notifications — for authenticated users reading their own notifications
router.get('/', asyncHandler(getMyNotifications));

router.get('/:userId', asyncHandler(getUserNotifications));

router.patch('/:id/read', asyncHandler(markNotificationAsRead));

export default router;
