import { env } from './config/env';
import { logger } from './utils/logger';
import { createApp } from './app';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'DocuMind backend listening');
});

/**
 * Graceful shutdown. When AWS (ECS) deploys a new version it sends SIGTERM
 * to the old container. We stop accepting new connections, let in-flight
 * requests finish, then exit. Without this, users get dropped mid-request.
 */
let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while closing server');
      process.exit(1);
    }
    logger.info('Server closed cleanly');
    process.exit(0);
  });

  // Safety net: if connections refuse to drain, force exit.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// A bug that escaped everything else: state is unknown, so log and exit.
// The orchestrator (ECS/Docker) will restart a fresh process.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
