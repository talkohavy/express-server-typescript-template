import { ForbiddenError } from '../../../lib/Errors';
import type { PermissionCheckerService } from '../services/permission-checker.service';
import type { HttpMethod, PermissionContext } from '../types';
import type { NextFunction, Request, Response } from 'express';

export function createRequirePermissionGuard(permissionChecker: PermissionCheckerService) {
  return async function requirePermission(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, method, path, params, body } = req;

      const permissionContext: PermissionContext = {
        user,
        method: method as HttpMethod,
        path,
        params,
        body,
      };

      const result = await permissionChecker.checkPermission(permissionContext);

      if (result.isAllowed) return next();

      next(new ForbiddenError(result.reason ?? 'Forbidden'));
    } catch (error) {
      next(error);
    }
  };
}
