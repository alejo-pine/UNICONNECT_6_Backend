import { Router } from 'express';
import authMiddleware from '../../../middleware/authMiddleware';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { asyncHandler } from '../../../utils/controller';
import { getMySubjects, getSubjectById, getSubjects } from './subjectController';

const router: Router = Router();

router.get('/', asyncHandler(getSubjects));

router.get(
  '/my-subjects',
  authMiddleware,
  asyncHandler((req, res) => getMySubjects(req as AuthenticatedRequest, res))
);

router.get('/:id', asyncHandler(getSubjectById));

export default router;
