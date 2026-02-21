import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { TopicManager, WebsocketClient } from '@src/lib/ws-client';
import type { Application } from 'express';

/**
 * @dependencies
 * - redis plugin
 *
 * @description
 * ## Redis client roles
 *
 * ### redis.sub
 *
 * A connection in subscriber mode can only run these operations: SUBSCRIBE/UNSUBSCRIBE/PING/QUIT.
 * We use redis.sub as a dedicated subscriber connection; used only to SUBSCRIBE to the topic channel so
 * this node receives messages to forward to its local WebSocket clients.
 *
 * ### redis.pub
 *
 * Our "normal" Redis client, which can run any operation (EVAL, SADD, SMEMBERS, PUBLISH, etc.).
 */
export function wsPlugin(app: Application) {
  app.httpServer ??= createServer(app);

  const { redis } = app;

  const wss = new WebSocketServer({ server: app.httpServer });
  const topicManager = new TopicManager(redis.pub);
  const wsClient = new WebsocketClient(wss, topicManager, redis.pub, redis.sub); // { heartbeat: { intervalMs: 10_000 } },

  app.wsClient = wsClient;
}
