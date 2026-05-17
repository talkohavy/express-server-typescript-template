import { createServer } from 'node:http';
import type { Application } from 'express';

export async function httpServerPlugin(app: Application) {
  app.httpServer ??= createServer(app);
}
