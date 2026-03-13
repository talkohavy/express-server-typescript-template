import { API_URLS } from '../../../common/constants';
import { NotFoundError } from '../../../lib/Errors';
import { joiBodyMiddleware } from '../../../middlewares/joi-body.middleware';
import { UserNotFoundError } from '../logic/users.errors';
import { getUserByEmailSchema } from './dto/get-user-by-email.dto';
import type { ControllerFactory } from '../../../lib/lucky-server';
import type { UserUtilitiesService } from '../services/user-utilities.service';
import type { Application, Request, Response } from 'express';

export class UserUtilitiesController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly userUtilitiesService: UserUtilitiesService,
  ) {}

  registerRoutes() {
    this.getUserByEmail();
  }

  private getUserByEmail() {
    this.app.post(
      API_URLS.getUserByEmail,
      joiBodyMiddleware(getUserByEmailSchema),
      async (req: Request, res: Response) => {
        try {
          const { body } = req;

          this.app.logger.info('POST /users/get-by-email - fetching user by email');

          const email = body.email!;
          const user = await this.userUtilitiesService.getUserByEmail(email);

          res.json(user);
        } catch (error: any) {
          if (error instanceof UserNotFoundError) {
            throw new NotFoundError(error.message);
          }

          throw error;
        }
      },
    );
  }
}
