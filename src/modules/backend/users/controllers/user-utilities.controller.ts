import { API_URLS, StatusCodes } from '../../../../common/constants';
import { ConfigKeys, type CookiesConfig } from '../../../../configurations';
import type { ControllerFactory } from '../../../../lib/lucky-server';
import type { IAuthAdapter } from '../../authentication/adapters/auth.adapter.interface';
import type { IUsersAdapter } from '../adapters/users.adapter.interface';
import type { Application, Request, Response } from 'express';

export class UserUtilitiesController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly usersAdapter: IUsersAdapter,
    private readonly authAdapter: IAuthAdapter,
  ) {}

  registerRoutes() {
    this.getProfile();
  }

  private getProfile() {
    this.app.get(API_URLS.getProfile, async (req: Request, res: Response) => {
      const { cookies } = req;

      this.app.logger.info(`GET ${API_URLS.getProfile} - get user profile`);

      const token = this.extractAccessTokenFromCookies(cookies);

      const decodedToken = await this.authAdapter.verifyToken(token);

      if (!decodedToken) return void res.status(StatusCodes.NO_CONTENT).json({}); // <--- silently fail

      const userId = decodedToken?.id;

      const fetchedUser = await this.usersAdapter.getUserById(userId);

      res.json(fetchedUser);
    });
  }

  private extractAccessTokenFromCookies(cookies: any) {
    const { accessCookie } = this.app.configService.get<CookiesConfig>(ConfigKeys.Cookies);
    return cookies[accessCookie.name];
  }
}
