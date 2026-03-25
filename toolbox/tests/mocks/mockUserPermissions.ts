import { Permissions } from '@src/common/constants/permissions';
import type { Application, NextFunction, Request, Response } from 'express';

export function giveAllPermissionsToUser(app: Application) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const allPermissions = [
      Permissions.users.create,
      Permissions.users.read,
      Permissions.users.update,
      Permissions.users.delete,
    ];

    req.userPermissions = allPermissions;
    next();
  });
}
