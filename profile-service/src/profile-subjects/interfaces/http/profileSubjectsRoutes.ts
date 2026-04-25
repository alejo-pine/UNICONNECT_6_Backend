import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import {
  addSubjectToProfileController,
  getSubjectsByProfile,
  removeSubjectFromProfileController,
} from './profileSubjectsController';

const router = Router();

router.get('/:profile_id', asyncHandler(getSubjectsByProfile));
router.post('/', asyncHandler(addSubjectToProfileController));
router.delete('/', asyncHandler(removeSubjectFromProfileController));

export default router;
