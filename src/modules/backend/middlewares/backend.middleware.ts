import { API_URLS } from '@src/common/constants';
import { ConfigKeys, type CookiesConfig } from '@src/configurations';
import type { IAuthAdapter } from '../authentication';
import type { UserToken } from '@src/common/types';
import type { Application, Request, Response, NextFunction } from 'express';

export class BackendMiddleware {
  public constructor(
    private readonly app: Application,
    private readonly authAdapter: IAuthAdapter,
  ) {}

  public useAuthenticationMiddleware() {
    this.app.use(API_URLS.users, this.attachUserFromTokenMiddleware);
  }

  private async attachUserFromTokenMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const { accessCookie } = this.app.configService.get<CookiesConfig>(ConfigKeys.Cookies);
    const token = req.cookies?.[accessCookie.name] as string | undefined;

    if (!token) return next();

    try {
      const decoded = await this.authAdapter.verifyToken(token);

      const user: UserToken = {
        id: decoded.id,
        role: decoded.role,
      };

      req.user = user;
    } catch {
      // Invalid or expired token - leave req.user unset
    }

    next();
  }
}
