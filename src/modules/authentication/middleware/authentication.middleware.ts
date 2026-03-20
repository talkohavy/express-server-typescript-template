import { API_PATHS } from '@src/common/constants';
import type { MiddlewareFactory } from '@src/lib/lucky-server';
import type { Application, NextFunction, Request, Response } from 'express';

export class AuthenticationMiddleware implements MiddlewareFactory {
  constructor(private readonly app: Application) {}

  use() {
    this.app.use(API_PATHS.auth, (_req: Request, _res: Response, next: NextFunction): void => {
      console.log('authentication middleware');

      next();
    });
  }
}
