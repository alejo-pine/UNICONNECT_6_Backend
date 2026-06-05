import { Router } from 'express';
import authMiddleware from '../../../middleware/auth';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { asyncHandler } from '../../../utils/controller';
import {
  createQuestion,
  getForumQuestions,
  createAnswer,
  getForumAnswers,
  voteAnswer,
  acceptAnswer,
} from './forumController';

const router: Router = Router();

// Todas las rutas del foro requieren autenticación
router.use(authMiddleware);

router.post(
  '/questions',
  asyncHandler((req, res) => createQuestion(req as AuthenticatedRequest, res))
);

router.get(
  '/subjects/:subjectId/questions',
  asyncHandler((req, res) => getForumQuestions(req as AuthenticatedRequest, res))
);

router.post(
  '/questions/:questionId/answers',
  asyncHandler((req, res) => createAnswer(req as AuthenticatedRequest, res))
);

router.get(
  '/questions/:questionId/answers',
  asyncHandler((req, res) => getForumAnswers(req as AuthenticatedRequest, res))
);

router.post(
  '/answers/:answerId/vote',
  asyncHandler((req, res) => voteAnswer(req as AuthenticatedRequest, res))
);

router.post(
  '/answers/:answerId/accept',
  asyncHandler((req, res) => acceptAnswer(req as AuthenticatedRequest, res))
);

export default router;
