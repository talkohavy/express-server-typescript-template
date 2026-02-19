import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import { EXCLUDED_PATHS } from '../common/constants';

export function bodyLimitPlugin(app: Application) {
  app.use(bodyLimitMiddleware);
}

function bodyLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (EXCLUDED_PATHS.includes(req.path)) return next();

  express.json({ limit: '10mb' })(req, res, next);
}
