// src/infrastructure/http/server.ts

import express, { Application } from 'express';
import cors from 'cors';
import { createRouter } from './router';
import { errorHandler } from '../../shared/middlewares/errorHandler';
import { ConversationController } from './controllers/ConversationController';
import { MessageController } from './controllers/MessageController';
import { WallPostController } from './controllers/WallPostController';
import { AttachmentController } from './controllers/AttachmentController';
import { logger } from '../../shared/logger';

export function createExpressApp(
  conversationController: ConversationController,
  messageController: MessageController,
  wallPostController: WallPostController,
  attachmentController: AttachmentController
): Application {
  const app = express();

  // ── Global middlewares ───────────────────────────────────────────────────────
  const corsOriginEnv = process.env['CORS_ORIGIN'] ?? '*';
  const corsOrigin = corsOriginEnv.includes(',') ? corsOriginEnv.split(',') : corsOriginEnv;
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'x-user-id'],
    })
  );

  app.use(express.json());

  // ── Health check (no auth required) ─────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', version: '1.0.0', service: 'ms-chat' });
  });

  // ── Application routes ───────────────────────────────────────────────────────
  app.use(
    '/api',
    createRouter(
      conversationController,
      messageController,
      wallPostController,
      attachmentController
    )
  );

  // ── Global error handler (must be last) ──────────────────────────────────────
  app.use(errorHandler);

  logger.info('Express application configured');
  return app;
}
