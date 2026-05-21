import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import { getClassmates } from './studentsController';

const router: Router = Router();

/**
 * @openapi
 * /classmates/{subjectId}:
 *   get:
 *     summary: GET /classmates/{subjectId}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
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
 * /classmates/{subjectId}:
 *   get:
 *     summary: GET /classmates/{subjectId}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
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
router.get('/classmates/:subjectId', asyncHandler(getClassmates));

export default router;
