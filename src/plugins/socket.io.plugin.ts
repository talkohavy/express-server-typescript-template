import { createServer } from 'http';
import { instrument } from '@socket.io/admin-ui';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer } from 'socket.io';
import { ALLOWED_DOMAINS } from './cors';
import type { Application } from 'express';

/**
 * @dependencies
 * - config-service plugin
 * - logger plugin
 * - redis plugin
 */
export async function socketIOPlugin(app: Application): Promise<void> {
  const { logger, redis } = app;
  const { pub: redisPub, sub: redisSub } = redis;

  const httpServer = createServer(app);

  const redisAdapter = createAdapter(redisPub, redisSub);

  const socketIOApp = new SocketIOServer(httpServer, {
    adapter: redisAdapter,
    cors: {
      origin: [...ALLOWED_DOMAINS, 'https://admin.socket.io'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    path: '/ws/v1',
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
      /**
       * Upon an unexpected disconnection (i.e. No manual disconnection with socket.disconnect()), the server will store the id, the rooms and the data attribute of the socket.
       * Then upon reconnection, the server will try to restore the state of the client. The recovered attribute indicates whether this recovery was successful.
       * The Redis Streams adapter enhances this by providing persistent message delivery across server restarts.
       */
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: false, // <--- defaults to true
    },
    allowUpgrades: true, // <--- defaults to true
  });

  app.socketIOApp = socketIOApp;
  app.httpServer = httpServer;

  // Enable Socket.IO Admin UI
  instrument(socketIOApp, {
    auth: false, // Set to true in production with proper authentication
    mode: process.env.NODE_ENV === 'dev' ? 'development' : 'production',
  });

  logger.log('🔗 Socket.IO server configured with connection state recovery');
  logger.log('📊 Socket.IO Admin UI enabled');
}
