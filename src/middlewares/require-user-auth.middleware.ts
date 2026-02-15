import { UnauthorizedError } from '../lib/Errors';
import type { Request, Response, NextFunction } from 'express';

export function requireUserAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();

  next();
}
