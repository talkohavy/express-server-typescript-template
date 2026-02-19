import cookieParser from 'cookie-parser';
import type { Application } from 'express';

export function cookieParserPlugin(app: Application) {
  app.use(cookieParser());
}
