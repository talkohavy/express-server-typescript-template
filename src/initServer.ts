import { hostname } from 'os';
import { COLORS } from 'color-my-json';
import { buildApp } from './app';
import { ConfigKeys } from './configurations';
import type { Application } from 'express';

startServer();

export async function startServer() {
  const app = await buildApp();

  const PORT = app.configService.get<number>(ConfigKeys.Port);

  console.log(`${COLORS.green}Open in browser: ${COLORS.blue}http://localhost:${PORT}${COLORS.stop}`);

  // WARNING!!! DO NOT LISTEN USING APP! While this doesn't affect normal routes, it does affect socketIO routes, They will not be able to connect.
  app.httpServer.listen(PORT, () => {
    const podHostname = hostname();
    const podId = `${podHostname.split('-').slice(-1)[0] || podHostname.substring(0, 8)}-${process.pid}`;

    app.logger.log(`🚀 server is up and running on port ${PORT} | Pod: ${podId} | Hostname: ${podHostname}`);
    app.logger.log('🔗 Redis adapter configured for Socket.IO multi-node support with robust connections');
  });

  app.httpServer.on('error', (error: Error) => {
    app.logger.error(error.message, { error });

    process.exit(1);
  });

  const gracefulShutdown = createGracefulShutdownHandler(app);
  const gracefulRejectionOrException = createGracefulRejectionOrExceptionHandler(app);

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('unhandledRejection', gracefulRejectionOrException);
  process.on('uncaughtException', gracefulRejectionOrException);
}

function createGracefulShutdownHandler(app: Application) {
  let isShuttingDown = false;

  return async function gracefulShutdown() {
    if (isShuttingDown) return;

    const { wsClient, logger } = app;

    isShuttingDown = true;

    logger.log('Shutting down gracefully...');

    try {
      await wsClient.cleanup();
    } catch (error) {
      logger.error('Redis WS cleanup failed during graceful shutdown', { error });
    }

    logger.log('Cleanup finished');
    process.exit(0);
  };
}

function createGracefulRejectionOrExceptionHandler(app: Application) {
  return async function gracefulRejectionOrException(error: Error) {
    console.error('unhandledRejection', { error });
    console.error('Should not get here!  You are missing a try/catch somewhere.');

    const runRedisCleanup = async () => {
      try {
        await app.wsClient.cleanup();
      } catch (error) {
        console.error('Redis WS cleanup failed during unexpected shutdown', { error });
      }
    };

    runRedisCleanup().finally(() => {
      process.exit(1);
    });
  };
}
