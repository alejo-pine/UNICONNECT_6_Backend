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
import { SupabaseModerationRepository } from './infrastructure/database/repositories/SupabaseModerationRepository';

// ── Application: Use cases ───────────────────────────────────────────────────
import { ListConversationsUseCase } from './application/use-cases/ListConversationsUseCase';
import { FindOrCreateConversationUseCase } from './application/use-cases/FindOrCreateConversationUseCase';
import { GetConversationUseCase } from './application/use-cases/GetConversationUseCase';
import { ListMessagesUseCase } from './application/use-cases/ListMessagesUseCase';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase';
import { ListWallPostsUseCase } from './application/use-cases/ListWallPostsUseCase';
import { CreateWallPostUseCase } from './application/use-cases/CreateWallPostUseCase';
import { ListWallInboxUseCase } from './application/use-cases/ListWallInboxUseCase';
import { GetDmAttachmentUrlUseCase } from './application/use-cases/GetDmAttachmentUrlUseCase';
import { GetWallAttachmentUrlUseCase } from './application/use-cases/GetWallAttachmentUrlUseCase';

// ── Infrastructure: Socket.IO ─────────────────────────────────────────────────
import { initSocketServer } from './infrastructure/socket/socketServer';
import { WallSocketObserver } from './infrastructure/socket/WallSocketObserver';
import { DmSocketObserver } from './infrastructure/socket/DmSocketObserver';

// ── Domain: Observer pattern ──────────────────────────────────────────────────
import { ChatSubject } from './domain/observer/ChatSubject';

// ── Infrastructure: Factories (Chain of Responsibility) ───────────────────────
import { ValidationChainFactory } from './infrastructure/factories/ValidationChainFactory';

// ── Infrastructure: HTTP ──────────────────────────────────────────────────────
import { ConversationController } from './infrastructure/http/controllers/ConversationController';
import { MessageController } from './infrastructure/http/controllers/MessageController';
import { WallPostController } from './infrastructure/http/controllers/WallPostController';
import { AttachmentController } from './infrastructure/http/controllers/AttachmentController';
import { PollController } from './infrastructure/http/controllers/PollController';
import { PollRepository } from './infrastructure/database/repositories/PollRepository';
import { CreatePollUseCase } from './application/use-cases/CreatePollUseCase';
import { VoteInPollUseCase } from './application/use-cases/VoteInPollUseCase';
import { ClosePollUseCase } from './application/use-cases/ClosePollUseCase';
import { PollSocketObserver } from './infrastructure/socket/PollSocketObserver';
import { PollExpirationScheduler } from './infrastructure/services/PollExpirationScheduler';
import { createExpressApp } from './infrastructure/http/server';

// ── Chatbot ───────────────────────────────────────────────────────────────────
import { SupabaseProfileReadRepository } from './infrastructure/database/repositories/SupabaseProfileReadRepository';
import { SupabaseChatbotRepository } from './infrastructure/database/repositories/SupabaseChatbotRepository';
import { GenerateChatbotResponseUseCase } from './application/use-cases/chatbot/GenerateChatbotResponseUseCase';
import { ListChatbotConversationsUseCase } from './application/use-cases/chatbot/ListChatbotConversationsUseCase';
import { GetChatbotConversationMessagesUseCase } from './application/use-cases/chatbot/GetChatbotConversationMessagesUseCase';
import { ChatbotController } from './infrastructure/http/controllers/ChatbotController';

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
  const pollRepo = new PollRepository(supabase);
  const moderationRepo = new SupabaseModerationRepository(supabase);
  const profileReadRepo = new SupabaseProfileReadRepository(supabase);
  const chatbotRepo = new SupabaseChatbotRepository(supabase);

  // ── 3. Factory: Chain of Responsibility (compone las cadenas de validación) ──
  // Único punto donde se ensamblan y se inyectan los repositorios a la cadena.
  const validationChainFactory = new ValidationChainFactory(
    conversationRepo,
    groupRepo,
    messageRepo,
    wallPostRepo,
    moderationRepo
  );

  // ── 4. Use cases (injected with repository interfaces) ─────────────────────
  const listConversations = new ListConversationsUseCase(conversationRepo);
  const findOrCreateConversation = new FindOrCreateConversationUseCase(conversationRepo);
  const getConversation = new GetConversationUseCase(conversationRepo);
  const listMessages = new ListMessagesUseCase(conversationRepo, messageRepo);
  const sendMessage = new SendMessageUseCase(messageRepo, validationChainFactory, moderationRepo, profileReadRepo);
  const listWallPosts = new ListWallPostsUseCase(wallPostRepo, groupRepo);
  const createWallPost = new CreateWallPostUseCase(wallPostRepo, validationChainFactory, moderationRepo, profileReadRepo);
  const listWallInbox = new ListWallInboxUseCase(groupRepo);
  const getDmAttachmentUrl = new GetDmAttachmentUrlUseCase(messageRepo, conversationRepo, storageRepo);
  const getWallAttachmentUrl = new GetWallAttachmentUrlUseCase(wallPostRepo, groupRepo, storageRepo);
  const createPoll = new CreatePollUseCase(wallPostRepo, pollRepo, groupRepo);
  const voteInPoll = new VoteInPollUseCase(pollRepo, wallPostRepo, groupRepo);
  const closePoll = new ClosePollUseCase(pollRepo, wallPostRepo);

  const generateChatbotResponse = new GenerateChatbotResponseUseCase(profileReadRepo, chatbotRepo);
  const listChatbotConversations = new ListChatbotConversationsUseCase(chatbotRepo);
  const getChatbotMessages = new GetChatbotConversationMessagesUseCase(chatbotRepo);

  // ── 5. HTTP server ─────────────────────────────────────────────────────────
  //    Create the raw HTTP server first so Socket.IO and Express share it.
  const httpServer = createServer();

  // ── 6. Socket.IO server (singleton, shares httpServer) ─────────────────────
  const io = initSocketServer(httpServer, conversationRepo, groupRepo);

  // ── 7. Observer pattern ────────────────────────────────────────────────────
  //  Canal WALL: chatSubject → WallSocketObserver → sala "wall:<id>"
  const chatSubject = new ChatSubject();
  chatSubject.subscribe(new WallSocketObserver(io));
  chatSubject.subscribe(new PollSocketObserver(io));

  //  Canal DM: dmSubject → DmSocketObserver → sala "conversation:<id>"
  //  Instancia TOTALMENTE INDEPENDIENTE de chatSubject: lista de observers
  //  distinta, sin canal compartido ni estado compartido.
  const dmSubject = new ChatSubject();
  dmSubject.subscribe(new DmSocketObserver(io));

  const pollExpirationScheduler = new PollExpirationScheduler(pollRepo, closePoll, chatSubject);
  pollExpirationScheduler.start();

  // ── 8. Controllers (inject subjects, not io directly) ───────────────────────
  const conversationController = new ConversationController(
    listConversations,
    findOrCreateConversation,
    getConversation
  );

  const messageController = new MessageController(
    listMessages,
    sendMessage,
    conversationRepo,
    dmSubject
  );

  const wallPostController = new WallPostController(listWallPosts, createWallPost, listWallInbox, chatSubject);

  const attachmentController = new AttachmentController(getDmAttachmentUrl, getWallAttachmentUrl);

  const pollController = new PollController(createPoll, voteInPoll, closePoll, chatSubject);

  const chatbotController = new ChatbotController(
    generateChatbotResponse,
    listChatbotConversations,
    getChatbotMessages
  );

  // ── 9. Express app ─────────────────────────────────────────────────────────
  const app = createExpressApp(
    conversationController,
    messageController,
    wallPostController,
    attachmentController,
    pollController,
    chatbotController
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
