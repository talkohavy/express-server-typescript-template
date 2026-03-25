import { API_PATHS } from '../../../common/constants';
import type { MiddlewareFactory } from '@src/lib/lucky-server';
import type { Application, NextFunction, Request, Response } from 'express';

export class BooksMiddleware implements MiddlewareFactory {
  constructor(private readonly app: Application) {}

  use() {
    this.app.use(API_PATHS.books, (_req: Request, _res: Response, next: NextFunction) => {
      this.app.logger.log('Books middleware');

      next();
    });
  }
}
