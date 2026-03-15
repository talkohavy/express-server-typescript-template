import { API_URLS } from '../../../common/constants';
import type { MiddlewareFactory } from '@src/lib/lucky-server';
import type { Application, NextFunction, Request, Response } from 'express';

export class BooksMiddleware implements MiddlewareFactory {
  constructor(private readonly app: Application) {}

  use() {
    this.app.use(API_URLS.books, (_req: Request, _res: Response, next: NextFunction) => {
      console.log('Books middleware');

      next();
    });
  }
}
