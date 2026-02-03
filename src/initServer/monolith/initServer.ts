import { COLORS } from 'color-my-json';
import { hostname } from 'os';
import { ConfigKeys } from '../../configurations';
import { buildApp } from './app';

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
    process.exit();
  });
}

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', { err });
  console.error('Should not get here!  You are missing a try/catch somewhere.');
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', { err });
  console.error('Should not get here! You are missing a try/catch somewhere.');
});
