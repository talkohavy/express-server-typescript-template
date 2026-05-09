import { mergeHeadersToUser } from '@src/common/utils/mergeHeadersToUser';
import type { NextFunction, Request, Response } from 'express';
import type { UserToken } from '@src/common/types';

export function attachUserFromHeadersMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.user) return next();

  const user = mergeHeadersToUser<UserToken>(req.headers);

  req.user = user;

  next();
}
