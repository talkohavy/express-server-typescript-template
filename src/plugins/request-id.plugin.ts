import { Headers } from '../common/constants';
import type { Application, NextFunction, Request, Response } from 'express';

export function addRequestIdHeaderPlugin(app: Application): void {
  app.use(addRequestIdHeaderMiddleware);
}

function addRequestIdHeaderMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers[Headers.RequestId] ??= crypto.randomUUID();

  next();
}
