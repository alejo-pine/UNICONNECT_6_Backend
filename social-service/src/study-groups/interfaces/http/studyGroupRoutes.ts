import { Router } from 'express';
import authMiddleware from '../../../middleware/auth';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { asyncHandler } from '../../../utils/controller';
import {
  createStudyGroup,
  getAllStudyGroups,
  getAvailableStudyGroupsBySubject,
  getMyStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
} from './studyGroupController';

const router: Router = Router();

router.get('/', asyncHandler((req, res) => getAllStudyGroups(req as AuthenticatedRequest, res)));

router.get(
  '/by-subject/:subjectId',
  authMiddleware,
  asyncHandler((req, res) => getAvailableStudyGroupsBySubject(req as AuthenticatedRequest, res))
);

router.get(
  '/my-groups',
  authMiddleware,
  asyncHandler((req, res) => getMyStudyGroups(req as AuthenticatedRequest, res))
);

router.post(
  '/',
  authMiddleware,
  asyncHandler((req, res) => createStudyGroup(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/join',
  authMiddleware,
  asyncHandler((req, res) => joinStudyGroup(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/leave',
  authMiddleware,
  asyncHandler((req, res) => leaveStudyGroup(req as AuthenticatedRequest, res))
);

export default router;
