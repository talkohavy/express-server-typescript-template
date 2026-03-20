import cookieParser from 'cookie-parser';
import type { Application } from 'express';

/**
 * @express
 */
export function cookieParserPlugin(app: Application) {
  app.use(cookieParser());
}
