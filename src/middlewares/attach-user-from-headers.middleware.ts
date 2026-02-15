import { mergeHeadersToUser } from '../common/utils/mergeHeadersToUser';
import type { UserToken } from '../common/types';
import type { NextFunction, Request, Response } from 'express';

export function attachUserFromHeadersMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.user) return next();

  const user = mergeHeadersToUser<UserToken>(req.headers);

  req.user = user;

  next();
}
