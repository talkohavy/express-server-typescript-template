import { createServer } from 'node:http';
import { WebsocketClient } from '../lib/ws-client';
import type { Application } from 'express';

/**
 * @dependencies
 * - redis plugin
 */
export function wsPlugin(app: Application) {
  app.httpServer ??= createServer(app);

  const { redis } = app;

  const wsClient = new WebsocketClient(
    { server: app.httpServer },
    {
      // heartbeat: { intervalMs: 10_000 },
    },
    redis.pub,
    redis.sub,
  );

  app.wsClient = wsClient;
}
