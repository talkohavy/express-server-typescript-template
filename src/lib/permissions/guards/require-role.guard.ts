import { ForbiddenError } from '../../../lib/Errors';
import { RoleTypes } from '../logic/constants';
import type { PermissionContext } from '../types';
import type { NextFunction, Request, Response } from 'express';

export function createRequireRoleGuard(roles: string[]) {
  return function requireRole(req: Request, _res: Response, next: NextFunction): void {
    const context = { user: req.user } as PermissionContext;

    const userRole = context.user?.role ?? RoleTypes.Guest;

    const hasRole = roles.includes(userRole);

    if (!hasRole) {
      next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
      return;
    }

    next();
  };
}
