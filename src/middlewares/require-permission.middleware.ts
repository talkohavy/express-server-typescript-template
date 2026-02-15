import { ForbiddenError } from '../lib/Errors';
import type { Request, Response, NextFunction } from 'express';

export function requirePermissionMiddleware(
  requiredPermissions: string[],
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const { userPermissions = [] } = req;

    const hasPermission = checkPermission(userPermissions, requiredPermissions);

    if (!hasPermission) {
      throw new ForbiddenError(`access denied. required permissions: [${requiredPermissions.join(', ')}]`);
    }

    next();
  };
}

function checkPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.some((permission) => requiredPermissions.includes(permission))) {
    return true;
  }

  return false;
}
