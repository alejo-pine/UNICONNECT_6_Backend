import { env } from './config/env';
import { eventLogger } from './utils/eventLogger';
import app from './app';

const server = app.listen(env.port, () => {
  eventLogger.info('Server', `Profile service running on port ${env.port}`);
  eventLogger.info('Server', `Environment: ${env.nodeEnv}`);
});

/**
 * Manejo de errores no capturados
 */
process.on('unhandledRejection', (reason) => {
  eventLogger.error('UnhandledRejection', `${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  eventLogger.error('UncaughtException', error.message, { stack: error.stack });
  process.exit(1);
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = (signal: string): void => {
  eventLogger.info('Server', `${signal} signal received`);
  server.close(() => {
    eventLogger.info('Server', 'Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { server };
