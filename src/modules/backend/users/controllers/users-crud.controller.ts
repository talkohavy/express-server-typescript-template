import { API_URLS, StatusCodes } from '@src/common/constants';
import { Permissions } from '@src/common/constants/permissions';
import { joiBodyMiddleware } from '@src/middlewares/joi-body.middleware';
import { requirePermissionMiddleware } from '@src/middlewares/require-permission.middleware';
import { requireUserAuthMiddleware } from '@src/middlewares/require-user-auth.middleware';
import { createUserSchema } from './dto/createUserSchema.dto';
import { updateUserSchema } from './dto/updateUserSchema.dto';
import type { IUsersAdapter } from '../adapters/users.adapter.interface';
import type { ControllerFactory } from '@src/lib/lucky-server';
import type { Application, Request, Response } from 'express';

export class UsersCrudController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly usersAdapter: IUsersAdapter,
  ) {}

  private createUser() {
    this.app.post(
      API_URLS.users,
      requirePermissionMiddleware([Permissions.users.create]),
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
    this.app.get(
      API_URLS.users,
      requirePermissionMiddleware([Permissions.users.read]),
      async (req: Request, res: Response) => {
        const { query } = req;

        this.app.logger.info(`GET ${API_URLS.users} - get all users`);

        const users = await this.usersAdapter.getUsers(query);

        res.json(users);
      },
    );
  }

  private getUserById() {
    this.app.get(
      API_URLS.userById,
      requirePermissionMiddleware([Permissions.users.read]),
      async (req: Request, res: Response) => {
        const { params } = req;

        const userId = params.userId! as string;

        this.app.logger.info(`GET ${API_URLS.userById} - get user by id`);

        const fetchedUser = await this.usersAdapter.getUserById(userId);

        res.json(fetchedUser);
      },
    );
  }

  private updateUser() {
    this.app.patch(
      API_URLS.userById,
      requireUserAuthMiddleware,
      requirePermissionMiddleware([Permissions.users.update]),
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
      requirePermissionMiddleware([Permissions.users.delete]),
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
