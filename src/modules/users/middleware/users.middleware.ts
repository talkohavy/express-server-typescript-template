import { API_PATHS } from '@src/common/constants';
import { attachUserFromHeadersMiddleware } from '../../../middlewares/attach-user-from-headers.middleware';
import type { MiddlewareFactory } from '@src/lib/lucky-server';
import type { Application } from 'express';

export class UsersMiddleware implements MiddlewareFactory {
  constructor(private readonly app: Application) {}

  use() {
    this.app.use(API_PATHS.users, attachUserFromHeadersMiddleware);
  }
}
