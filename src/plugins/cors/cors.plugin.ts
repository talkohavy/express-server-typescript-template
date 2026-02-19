import cors from 'cors';
import { Environment } from '../../common/constants';
import { handleCors } from './logic/utils/handleCors';
import type { Application } from 'express';

export function corsPlugin(app: Application) {
  app.use(corsMiddleware());
}

function corsMiddleware() {
  return cors({
    origin: handleCors(Environment.Dev),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true, // <--- Important! You'll get CORS Error without it.
  });
}
