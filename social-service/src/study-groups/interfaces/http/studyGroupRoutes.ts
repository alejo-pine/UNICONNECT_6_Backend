import { Router } from 'express';
import authMiddleware from '../../../middleware/auth';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { asyncHandler } from '../../../utils/controller';
import {
  acceptStudyGroupRequest,
  createStudyGroup,
  createStudySession,
  updateStudySession,
  getAllStudyGroups,
  getAvailableStudyGroupsBySubject,
  getMyStudyGroups,
  getStudyGroupDetail,
  joinStudyGroup,
  leaveStudyGroup,
  getGroupMembers,
  respondAdminTransfer,
  rejectStudyGroupRequest,
  transferStudyGroupAdmin,
  getStudySessions,
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

router.get(
  '/:groupId',
  authMiddleware,
  asyncHandler((req, res) => getStudyGroupDetail(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/requests/:userId/accept',
  authMiddleware,
  asyncHandler((req, res) => acceptStudyGroupRequest(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/requests/:userId/reject',
  authMiddleware,
  asyncHandler((req, res) => rejectStudyGroupRequest(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/transfer-admin',
  authMiddleware,
  asyncHandler((req, res) => transferStudyGroupAdmin(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/transfer-admin/respond',
  authMiddleware,
  asyncHandler((req, res) => respondAdminTransfer(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/leave',
  authMiddleware,
  asyncHandler((req, res) => leaveStudyGroup(req as AuthenticatedRequest, res))
);

router.get(
  '/:groupId/members',
  authMiddleware,
  asyncHandler((req, res) => getGroupMembers(req as AuthenticatedRequest, res))
);

router.post(
  '/:groupId/sessions',
  authMiddleware,
  asyncHandler((req, res) => createStudySession(req as AuthenticatedRequest, res))
);

router.get(
  '/:groupId/sessions',
  authMiddleware,
  asyncHandler((req, res) => getStudySessions(req as AuthenticatedRequest, res))
);

router.put(
  '/sessions/:sessionId',
  authMiddleware,
  asyncHandler((req, res) => updateStudySession(req as AuthenticatedRequest, res))
);

export default router;
