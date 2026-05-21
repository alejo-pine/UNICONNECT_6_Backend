// src/infrastructure/http/router.ts

import { Router } from 'express';
import { extractUserId } from '../../shared/middlewares/extractUserId';
import { ConversationController } from './controllers/ConversationController';
import { MessageController } from './controllers/MessageController';
import { WallPostController } from './controllers/WallPostController';
import { AttachmentController } from './controllers/AttachmentController';
import { PollController } from './controllers/PollController';

export function createRouter(
  conversationController: ConversationController,
  messageController: MessageController,
  wallPostController: WallPostController,
  attachmentController: AttachmentController,
  pollController: PollController
): Router {
  const router = Router();

  // All routes below require x-user-id header
  router.use(extractUserId);

  // ── Conversations ────────────────────────────────────────────────────────────
  // GET  /api/conversations
/**
 * @openapi
 * /conversations:
 *   get:
 *     summary: GET /conversations
 *     tags: [Chat]
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
  router.get('/conversations', conversationController.getAll);

  // POST /api/conversations
/**
 * @openapi
 * /conversations:
 *   post:
 *     summary: POST /conversations
 *     tags: [Chat]
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
  router.post('/conversations', conversationController.create);

  // GET  /api/conversations/:id
/**
 * @openapi
 * /conversations/{id}:
 *   get:
 *     summary: GET /conversations/{id}
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
  router.get('/conversations/:id', conversationController.getById);

  // ── Messages ─────────────────────────────────────────────────────────────────
  // GET  /api/conversations/:id/messages
/**
 * @openapi
 * /conversations/{id}/messages:
 *   get:
 *     summary: GET /conversations/{id}/messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
  router.get('/conversations/:id/messages', messageController.getMessages);

  // POST /api/conversations/:id/messages
/**
 * @openapi
 * /conversations/{id}/messages:
 *   post:
 *     summary: POST /conversations/{id}/messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
  router.post('/conversations/:id/messages', messageController.postMessage);

  // ── Wall posts ───────────────────────────────────────────────────────────────
  // GET  /api/walls (Wall Inbox)
/**
 * @openapi
 * /walls:
 *   get:
 *     summary: GET /walls
 *     tags: [Chat]
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
  router.get('/walls', wallPostController.getWallInbox);

  // GET  /api/groups/:groupId/wall
/**
 * @openapi
 * /groups/{groupId}/wall:
 *   get:
 *     summary: GET /groups/{groupId}/wall
 *     tags: [Chat]
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
  router.get('/groups/:groupId/wall', wallPostController.getPosts);

  // POST /api/groups/:groupId/wall
/**
 * @openapi
 * /groups/{groupId}/wall:
 *   post:
 *     summary: POST /groups/{groupId}/wall
 *     tags: [Chat]
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
  router.post('/groups/:groupId/wall', wallPostController.createPost);

  // ── Polls ────────────────────────────────────────────────────────────────────
  // POST /api/groups/:groupId/wall/polls
/**
 * @openapi
 * /groups/{groupId}/wall/polls:
 *   post:
 *     summary: POST /groups/{groupId}/wall/polls
 *     tags: [Chat]
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
  router.post('/groups/:groupId/wall/polls', pollController.createPoll);

  // POST /api/polls/:pollId/votes
/**
 * @openapi
 * /polls/{pollId}/votes:
 *   post:
 *     summary: POST /polls/{pollId}/votes
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
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
  router.post('/polls/:pollId/votes', pollController.vote);

  // PATCH /api/polls/:pollId/close
/**
 * @openapi
 * /polls/{pollId}/close:
 *   patch:
 *     summary: PATCH /polls/{pollId}/close
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
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
  router.patch('/polls/:pollId/close', pollController.close);

  // ── Attachment signed URLs ───────────────────────────────────────────────────
  // GET  /api/attachments/dm/:attachmentId/url
/**
 * @openapi
 * /attachments/dm/{attachmentId}/url:
 *   get:
 *     summary: GET /attachments/dm/{attachmentId}/url
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attachmentId
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
  router.get('/attachments/dm/:attachmentId/url', attachmentController.getDmSignedUrl);

  // GET  /api/attachments/wall/:attachmentId/url
/**
 * @openapi
 * /attachments/wall/{attachmentId}/url:
 *   get:
 *     summary: GET /attachments/wall/{attachmentId}/url
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attachmentId
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
  router.get('/attachments/wall/:attachmentId/url', attachmentController.getWallSignedUrl);

  return router;
}
