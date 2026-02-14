import type { PermissionContext } from '../types';

export type HasRoleProps = {
  context: PermissionContext;
  roles: string[];
};
