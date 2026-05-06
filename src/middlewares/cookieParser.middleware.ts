import cookieParser from 'cookie-parser';
import type { Application } from 'express';

/**
 * @express
 */
export function registerCookieParserMiddleware(app: Application) {
  app.use(cookieParser());
}
