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

  const shutdown = gracefulShutdown(app);

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function gracefulShutdown(app: Application) {
  let isShuttingDown = false;

  return async function shutdown() {
    if (isShuttingDown) return;

    isShuttingDown = true;

    app.logger.log('Shutting down gracefully...');

    await new Promise<void>((resolve) => {
      app.httpServer.close(() => {
        app.logger.log('HTTP server closed');
        resolve();
      });
    });

    // Add more cleanup here (e.g. close DB/Redis connections)
    app.logger.log('Cleanup finished');
    process.exit(0);
  };
}

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', { err });
  console.error('Should not get here!  You are missing a try/catch somewhere.');
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', { err });
  console.error('Should not get here! You are missing a try/catch somewhere.');
});
