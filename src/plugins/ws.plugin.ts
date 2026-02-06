import { createServer } from 'node:http';
import { WebsocketClient } from '../lib/ws-client';
import type { Application } from 'express';

export function wsPlugin(app: Application) {
  app.httpServer ??= createServer(app);

  const wsClient = new WebsocketClient({ server: app.httpServer });

  app.wsClient = wsClient;
}
