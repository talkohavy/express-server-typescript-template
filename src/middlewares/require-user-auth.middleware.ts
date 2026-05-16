import { UnauthorizedError } from '@src/core/errors';
import type { Request, Response, NextFunction } from 'express';

export function requireUserAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();

  next();
}
