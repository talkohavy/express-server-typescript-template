import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import type { Application } from 'express';

export function wsPlugin(app: Application) {
  app.httpServer ??= createServer(app);

  const wss = new WebSocketServer({ server: app.httpServer });

  app.wss = wss;
}
