import { API_URLS } from '@src/common/constants';
import { attachUserFromHeadersMiddleware } from '../../../middlewares/attach-user-from-headers.middleware';
import type { Application } from 'express';

export class UsersMiddleware {
  public constructor(private readonly app: Application) {}

  public use() {
    this.app.use(API_URLS.users, attachUserFromHeadersMiddleware);
  }
}
