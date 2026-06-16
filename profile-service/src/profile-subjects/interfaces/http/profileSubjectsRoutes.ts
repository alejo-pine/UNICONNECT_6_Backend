import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import {
  addSubjectToProfileController,
  getSubjectsByProfile,
  removeSubjectFromProfileController,
} from './profileSubjectsController';

const router = Router();

/**
 * @openapi
 * /{profile_id}:
 *   get:
 *     summary: GET /{profile_id}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profile_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
/**
 * @openapi
 * /{profile_id}:
 *   get:
 *     summary: GET /{profile_id}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profile_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:profile_id', asyncHandler(getSubjectsByProfile));
/**
 * @openapi
 * /:
 *   post:
 *     summary: POST /
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', asyncHandler(addSubjectToProfileController));
/**
 * @openapi
 * /:
 *   delete:
 *     summary: DELETE /
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/', asyncHandler(removeSubjectFromProfileController));

export default router;
