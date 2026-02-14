import { createRequirePermissionGuard, type PermissionCheckerService } from '@src/lib/permissions';
import { API_URLS, StatusCodes } from '../../../common/constants';
import { joiBodyMiddleware } from '../../../middlewares/joi-body.middleware';
import { createUserSchema } from './dto/createUserSchema.dto';
import { updateUserSchema } from './dto/updateUserSchema.dto';
import type { ControllerFactory } from '../../../lib/lucky-server';
import type { UsersCrudService } from '../services/users-crud.service';
import type { Application, NextFunction, Request, Response } from 'express';

export class UsersCrudController implements ControllerFactory {
  private requireUserPermission: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  constructor(
    private readonly app: Application,
    private readonly usersService: UsersCrudService,
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

        const user = await this.usersService.createUser(body);

        res.status(StatusCodes.CREATED).json(user);
      },
    );
  }

  private getUsers() {
    this.app.get(API_URLS.users, this.requireUserPermission, async (req: Request, res: Response) => {
      const { query } = req;

      this.app.logger.info(`GET ${API_URLS.users} - get all users`);

      const users = await this.usersService.getUsers(query);

      res.json(users);
    });
  }

  private getUserById() {
    this.app.get(API_URLS.userById, this.requireUserPermission, async (req: Request, res: Response) => {
      const { params } = req;

      const id = params.userId! as string;

      this.app.logger.info(`GET ${API_URLS.userById} - get user by id`);

      const fetchedUser = await this.usersService.getUserById(id);

      res.json(fetchedUser);
    });
  }

  private updateUserById() {
    this.app.patch(
      API_URLS.userById,
      this.requireUserPermission,
      joiBodyMiddleware(updateUserSchema),
      async (req: Request, res: Response) => {
        const { body, params } = req;

        this.app.logger.info(`PATCH ${API_URLS.userById} - updating user by ID`);

        const userId = params.userId!;

        const updatedUser = await this.usersService.updateUserById(userId, body);

        res.json(updatedUser);
      },
    );
  }

  private deleteUserById() {
    this.app.delete(API_URLS.userById, this.requireUserPermission, async (req: Request, res: Response) => {
      const { params } = req;

      const userId = params.userId!;

      this.app.logger.info(`DELETE ${API_URLS.userById} - delete user`);

      const result = await this.usersService.deleteUserById(userId);

      res.json(result);
    });
  }

  registerRoutes() {
    this.createUser();
    this.getUsers();
    this.getUserById();
    this.updateUserById();
    this.deleteUserById();
  }
}
