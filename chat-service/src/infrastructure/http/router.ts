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
  router.get('/conversations', conversationController.getAll);

  // POST /api/conversations
  router.post('/conversations', conversationController.create);

  // GET  /api/conversations/:id
  router.get('/conversations/:id', conversationController.getById);

  // ── Messages ─────────────────────────────────────────────────────────────────
  // GET  /api/conversations/:id/messages
  router.get('/conversations/:id/messages', messageController.getMessages);

  // POST /api/conversations/:id/messages
  router.post('/conversations/:id/messages', messageController.postMessage);

  // ── Wall posts ───────────────────────────────────────────────────────────────
  // GET  /api/walls (Wall Inbox)
  router.get('/walls', wallPostController.getWallInbox);

  // GET  /api/groups/:groupId/wall
  router.get('/groups/:groupId/wall', wallPostController.getPosts);

  // POST /api/groups/:groupId/wall
  router.post('/groups/:groupId/wall', wallPostController.createPost);

  // ── Polls ────────────────────────────────────────────────────────────────────
  // POST /api/groups/:groupId/wall/polls
  router.post('/groups/:groupId/wall/polls', pollController.createPoll);

  // POST /api/polls/:pollId/votes
  router.post('/polls/:pollId/votes', pollController.vote);

  // PATCH /api/polls/:pollId/close
  router.patch('/polls/:pollId/close', pollController.close);

  // ── Attachment signed URLs ───────────────────────────────────────────────────
  // GET  /api/attachments/dm/:attachmentId/url
  router.get('/attachments/dm/:attachmentId/url', attachmentController.getDmSignedUrl);

  // GET  /api/attachments/wall/:attachmentId/url
  router.get('/attachments/wall/:attachmentId/url', attachmentController.getWallSignedUrl);

  return router;
}
