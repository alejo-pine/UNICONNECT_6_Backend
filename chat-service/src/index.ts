// src/index.ts
// Entry point — bootstraps the application using manual dependency injection.

import 'dotenv/config';
import { createServer } from 'http';

import { logger } from './shared/logger';

// ── Infrastructure: Database ─────────────────────────────────────────────────
import { getSupabaseClient } from './infrastructure/database/supabaseClient';
import { ConversationRepository } from './infrastructure/database/repositories/ConversationRepository';
import { MessageRepository } from './infrastructure/database/repositories/MessageRepository';
import { WallPostRepository } from './infrastructure/database/repositories/WallPostRepository';
import { GroupRepository } from './infrastructure/database/repositories/GroupRepository';
import { StorageRepository } from './infrastructure/database/repositories/StorageRepository';

// ── Application: Use cases ───────────────────────────────────────────────────
import { ListConversationsUseCase } from './application/use-cases/ListConversationsUseCase';
import { FindOrCreateConversationUseCase } from './application/use-cases/FindOrCreateConversationUseCase';
import { GetConversationUseCase } from './application/use-cases/GetConversationUseCase';
import { ListMessagesUseCase } from './application/use-cases/ListMessagesUseCase';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase';
import { ListWallPostsUseCase } from './application/use-cases/ListWallPostsUseCase';
import { CreateWallPostUseCase } from './application/use-cases/CreateWallPostUseCase';
import { GetDmAttachmentUrlUseCase } from './application/use-cases/GetDmAttachmentUrlUseCase';
import { GetWallAttachmentUrlUseCase } from './application/use-cases/GetWallAttachmentUrlUseCase';

// ── Infrastructure: Socket.IO ─────────────────────────────────────────────────
import { initSocketServer } from './infrastructure/socket/socketServer';

// ── Infrastructure: HTTP ──────────────────────────────────────────────────────
import { ConversationController } from './infrastructure/http/controllers/ConversationController';
import { MessageController } from './infrastructure/http/controllers/MessageController';
import { WallPostController } from './infrastructure/http/controllers/WallPostController';
import { AttachmentController } from './infrastructure/http/controllers/AttachmentController';
import { createExpressApp } from './infrastructure/http/server';

function bootstrap(): void {
  const port = parseInt(process.env['PORT'] ?? '3001', 10);

  // ── 1. Supabase client (singleton) ─────────────────────────────────────────
  const supabase = getSupabaseClient();

  // ── 2. Repositories ────────────────────────────────────────────────────────
  const conversationRepo = new ConversationRepository(supabase);
  const messageRepo = new MessageRepository(supabase);
  const wallPostRepo = new WallPostRepository(supabase);
  const groupRepo = new GroupRepository(supabase);
  const storageRepo = new StorageRepository(supabase);

  // ── 3. Use cases (injected with repository interfaces) ─────────────────────
  const listConversations = new ListConversationsUseCase(conversationRepo);
  const findOrCreateConversation = new FindOrCreateConversationUseCase(conversationRepo);
  const getConversation = new GetConversationUseCase(conversationRepo);
  const listMessages = new ListMessagesUseCase(conversationRepo, messageRepo);
  const sendMessage = new SendMessageUseCase(conversationRepo, messageRepo);
  const listWallPosts = new ListWallPostsUseCase(wallPostRepo, groupRepo);
  const createWallPost = new CreateWallPostUseCase(wallPostRepo, groupRepo);
  const getDmAttachmentUrl = new GetDmAttachmentUrlUseCase(messageRepo, conversationRepo, storageRepo);
  const getWallAttachmentUrl = new GetWallAttachmentUrlUseCase(wallPostRepo, groupRepo, storageRepo);

  // ── 4. HTTP server ─────────────────────────────────────────────────────────
  //    Create the raw HTTP server first so Socket.IO and Express share it.
  const httpServer = createServer();

  // ── 5. Socket.IO server (singleton, shares httpServer) ─────────────────────
  const io = initSocketServer(httpServer, conversationRepo, groupRepo);

  // ── 6. Controllers (need io to emit events after REST operations) ───────────
  const conversationController = new ConversationController(
    listConversations,
    findOrCreateConversation,
    getConversation
  );

  const messageController = new MessageController(
    listMessages,
    sendMessage,
    conversationRepo,
    io
  );

  const wallPostController = new WallPostController(listWallPosts, createWallPost, io);

  const attachmentController = new AttachmentController(getDmAttachmentUrl, getWallAttachmentUrl);

  // ── 7. Express app ─────────────────────────────────────────────────────────
  const app = createExpressApp(
    conversationController,
    messageController,
    wallPostController,
    attachmentController
  );

  // Attach Express to the shared HTTP server
  httpServer.on('request', app);

  // ── 8. Start listening ─────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    logger.info(`ms-chat listening on port ${port}`, { port });
  });

  // ── 9. Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { message: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error('Unhandled promise rejection', { reason: message });
    process.exit(1);
  });
}

bootstrap();
