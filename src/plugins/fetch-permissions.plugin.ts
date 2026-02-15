import { Permissions } from '../common/constants/permissions';
import type { Request, Response, NextFunction, Application } from 'express';

export async function fetchPermissionsPlugin(app: Application): Promise<void> {
  app.use(fetchPermissionsMiddleware);
}

async function fetchPermissionsMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // TODO: Implement permissions fetching from the database

  // Mock permissions for now
  const allPermissions = [
    Permissions.users.create,
    Permissions.users.read,
    Permissions.users.update,
    Permissions.users.delete,
  ];

  req.userPermissions = allPermissions;

  next();
}
