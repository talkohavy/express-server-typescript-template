import { WebSocketServer } from 'ws';
import type { Application } from 'express';

/**
 * @dependencies
 * - http-server plugin
 */
export async function wsPlugin(app: Application) {
  app.wsApp = new WebSocketServer({ server: app.httpServer });
}
