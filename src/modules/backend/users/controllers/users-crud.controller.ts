import { createRequirePermissionGuard, type PermissionCheckerService } from '@src/lib/permissions';
import { API_URLS, StatusCodes } from '../../../../common/constants';
import { joiBodyMiddleware } from '../../../../middlewares/joi-body.middleware';
import { requireUserAuthMiddleware } from '../../../../middlewares/require-user-auth.middleware';
import { createUserSchema } from './dto/createUserSchema.dto';
import { updateUserSchema } from './dto/updateUserSchema.dto';
import type { ControllerFactory } from '../../../../lib/lucky-server';
import type { IUsersAdapter } from '../adapters/users.adapter.interface';
import type { Application, NextFunction, Request, Response } from 'express';

export class UsersCrudController implements ControllerFactory {
  private requireUserPermission: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  constructor(
    private readonly app: Application,
    private readonly usersAdapter: IUsersAdapter,
    private readonly permissionCheckerService: PermissionCheckerService,
  ) {
    this.requireUserPermission = createRequirePermissionGuard(this.permissionCheckerService);
  }

  private createUser() {
    this.app.post(
      API_URLS.users,
      this.requireUserPermission,
      joiBodyMiddleware(createUserSchema),
      async (req: Request, res: Response) => {
        const { body } = req;

        this.app.logger.info(`POST ${API_URLS.users} - create new user`);

        const user = await this.usersAdapter.createUser(body);

        res.status(StatusCodes.CREATED).json(user);
      },
    );
  }

  private getUsers() {
    this.app.get(API_URLS.users, this.requireUserPermission, async (req: Request, res: Response) => {
      const { query } = req;

      this.app.logger.info(`GET ${API_URLS.users} - get all users`);

      const users = await this.usersAdapter.getUsers(query);

      res.json(users);
    });
  }

  private getUserById() {
    this.app.get(API_URLS.userById, this.requireUserPermission, async (req: Request, res: Response) => {
      const { params } = req;

      const userId = params.userId! as string;

      this.app.logger.info(`GET ${API_URLS.userById} - get user by id`);

      const fetchedUser = await this.usersAdapter.getUserById(userId);

      res.json(fetchedUser);
    });
  }

  private updateUser() {
    this.app.patch(
      API_URLS.userById,
      requireUserAuthMiddleware,
      this.requireUserPermission,
      joiBodyMiddleware(updateUserSchema),
      async (req: Request, res: Response) => {
        const { body, params } = req;

        this.app.logger.info(`PATCH ${API_URLS.userById} - updating user by ID`);

        const userId = params.userId!;
        const updatedUser = await this.usersAdapter.updateUserById(userId, body);

        res.json(updatedUser);
      },
    );
  }

  private deleteUser() {
    this.app.delete(
      API_URLS.userById,
      requireUserAuthMiddleware,
      this.requireUserPermission,
      async (req: Request, res: Response) => {
        const { params } = req;

        const id = params.userId!;

        this.app.logger.info(`DELETE ${API_URLS.userById} - delete user`);

        const result = await this.usersAdapter.deleteUserById(id);

        res.json(result);
      },
    );
  }

  registerRoutes() {
    this.createUser();
    this.getUsers();
    this.getUserById();
    this.updateUser();
    this.deleteUser();
  }
}
