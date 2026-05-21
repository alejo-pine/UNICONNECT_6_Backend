// src/infrastructure/http/server.ts

import express, { Application } from 'express';
import cors from 'cors';
import { createRouter } from './router';
import { errorHandler } from '../../shared/middlewares/errorHandler';
import { ConversationController } from './controllers/ConversationController';
import { MessageController } from './controllers/MessageController';
import { WallPostController } from './controllers/WallPostController';
import { AttachmentController } from './controllers/AttachmentController';
import { PollController } from './controllers/PollController';
import { logger } from '../../shared/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp(
  conversationController: ConversationController,
  messageController: MessageController,
  wallPostController: WallPostController,
  attachmentController: AttachmentController,
  pollController: PollController
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

  app.get('/openapi.json', (_req, res) => {
    try {
      const docsPath = path.resolve(__dirname, '../../../docs/openapi.json');
      if (fs.existsSync(docsPath)) {
        const spec = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        res.setHeader('Content-Type', 'application/json');
        res.send(spec);
      } else {
        res.status(404).json({ error: 'OpenAPI spec not found. Did you run build:openapi?' });
      }
    } catch (error) {
      logger.error('Error reading openapi.json:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // ── Application routes ───────────────────────────────────────────────────────
  app.use(
    '/api',
    createRouter(
      conversationController,
      messageController,
      wallPostController,
      attachmentController,
      pollController
    )
  );

  // ── Global error handler (must be last) ──────────────────────────────────────
  app.use(errorHandler);

  logger.info('Express application configured');
  return app;
}
