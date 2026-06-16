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
  extractOpenGraph,
  createResource,
  getGroupResources,
  editResource,
  deleteStudySession,
  updateSessionAttendance,
} from './studyGroupController';

const router: Router = Router();

/**
 * @openapi
 * /study-groups:
 *   get:
 *     summary: Get all study groups
 *     description: Retrieve a list of all available study groups
 *     tags:
 *       - Study Groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of study groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 */
/**
 * @openapi
 * /:
 *   get:
 *     summary: GET /
 *     tags: [Social]
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
router.get('/', asyncHandler((req, res) => getAllStudyGroups(req as AuthenticatedRequest, res)));

/**
 * @openapi
 * /open-graph:
 *   get:
 *     summary: GET /open-graph
 *     tags: [Social]
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
router.get(
  '/open-graph',
  authMiddleware,
  asyncHandler((req, res) => extractOpenGraph(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /by-subject/{subjectId}:
 *   get:
 *     summary: GET /by-subject/{subjectId}
 *     tags: [Social]
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
router.get(
  '/by-subject/:subjectId',
  authMiddleware,
  asyncHandler((req, res) => getAvailableStudyGroupsBySubject(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /my-groups:
 *   get:
 *     summary: GET /my-groups
 *     tags: [Social]
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
router.get(
  '/my-groups',
  authMiddleware,
  asyncHandler((req, res) => getMyStudyGroups(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /:
 *   post:
 *     summary: POST /
 *     tags: [Social]
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
router.post(
  '/',
  authMiddleware,
  asyncHandler((req, res) => createStudyGroup(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/join:
 *   post:
 *     summary: POST /{groupId}/join
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/join',
  authMiddleware,
  asyncHandler((req, res) => joinStudyGroup(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}:
 *   get:
 *     summary: GET /{groupId}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.get(
  '/:groupId',
  authMiddleware,
  asyncHandler((req, res) => getStudyGroupDetail(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/requests/{userId}/accept:
 *   post:
 *     summary: POST /{groupId}/requests/{userId}/accept
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
router.post(
  '/:groupId/requests/:userId/accept',
  authMiddleware,
  asyncHandler((req, res) => acceptStudyGroupRequest(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/requests/{userId}/reject:
 *   post:
 *     summary: POST /{groupId}/requests/{userId}/reject
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
router.post(
  '/:groupId/requests/:userId/reject',
  authMiddleware,
  asyncHandler((req, res) => rejectStudyGroupRequest(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/transfer-admin:
 *   post:
 *     summary: POST /{groupId}/transfer-admin
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/transfer-admin',
  authMiddleware,
  asyncHandler((req, res) => transferStudyGroupAdmin(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/transfer-admin/respond:
 *   post:
 *     summary: POST /{groupId}/transfer-admin/respond
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/transfer-admin/respond',
  authMiddleware,
  asyncHandler((req, res) => respondAdminTransfer(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/leave:
 *   post:
 *     summary: POST /{groupId}/leave
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/leave',
  authMiddleware,
  asyncHandler((req, res) => leaveStudyGroup(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/members:
 *   get:
 *     summary: GET /{groupId}/members
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.get(
  '/:groupId/members',
  authMiddleware,
  asyncHandler((req, res) => getGroupMembers(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/sessions:
 *   post:
 *     summary: POST /{groupId}/sessions
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/sessions',
  authMiddleware,
  asyncHandler((req, res) => createStudySession(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/sessions:
 *   get:
 *     summary: GET /{groupId}/sessions
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.get(
  '/:groupId/sessions',
  authMiddleware,
  asyncHandler((req, res) => getStudySessions(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/sessions/{sessionId}:
 *   delete:
 *     summary: DELETE /{groupId}/sessions/{sessionId}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
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
router.delete(
  '/:groupId/sessions/:sessionId',
  authMiddleware,
  asyncHandler((req, res) => deleteStudySession(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/sessions/{sessionId}/attendance:
 *   post:
 *     summary: POST /{groupId}/sessions/{sessionId}/attendance
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
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
router.post(
  '/:groupId/sessions/:sessionId/attendance',
  authMiddleware,
  asyncHandler((req, res) => updateSessionAttendance(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/resources:
 *   post:
 *     summary: POST /{groupId}/resources
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.post(
  '/:groupId/resources',
  authMiddleware,
  asyncHandler((req, res) => createResource(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/resources:
 *   get:
 *     summary: GET /{groupId}/resources
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
router.get(
  '/:groupId/resources',
  authMiddleware,
  asyncHandler((req, res) => getGroupResources(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /{groupId}/resources/{resourceId}:
 *   put:
 *     summary: PUT /{groupId}/resources/{resourceId}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: resourceId
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
router.put(
  '/:groupId/resources/:resourceId',
  authMiddleware,
  asyncHandler((req, res) => editResource(req as AuthenticatedRequest, res))
);

/**
 * @openapi
 * /sessions/{sessionId}:
 *   put:
 *     summary: PUT /sessions/{sessionId}
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
router.put(
  '/sessions/:sessionId',
  authMiddleware,
  asyncHandler((req, res) => updateStudySession(req as AuthenticatedRequest, res))
);

export default router;
