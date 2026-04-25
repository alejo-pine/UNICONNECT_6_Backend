import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import { getClassmates } from './studentsController';

const router: Router = Router();

router.get('/classmates/:subjectId', asyncHandler(getClassmates));

export default router;
