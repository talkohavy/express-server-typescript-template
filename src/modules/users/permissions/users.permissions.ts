import { RoleTypes, type PermissionRule } from '@src/lib/permissions';
import { HttpMethod, type HttpMethodValues } from '../../../common/constants';

const USERS_BASE = '/api/users';
const USERS_BY_ID = '/api/users/:userId';

export function buildUsersPermissionRules(): PermissionRule[] {
  const rules: PermissionRule[] = [];

  const descriptors: Array<{ method: HttpMethodValues; path: string; role: string }> = [
    { role: RoleTypes.Guest, path: USERS_BASE, method: HttpMethod.POST },
    { role: RoleTypes.Admin, path: USERS_BASE, method: HttpMethod.POST },
    { role: RoleTypes.Admin, path: USERS_BASE, method: HttpMethod.GET },
    { role: RoleTypes.User, path: USERS_BY_ID, method: HttpMethod.GET },
    { role: RoleTypes.Admin, path: USERS_BY_ID, method: HttpMethod.GET },
    { role: RoleTypes.User, path: USERS_BY_ID, method: HttpMethod.PATCH },
    { role: RoleTypes.Admin, path: USERS_BY_ID, method: HttpMethod.PATCH },
    { role: RoleTypes.Admin, path: USERS_BY_ID, method: HttpMethod.DELETE },
  ];

  descriptors.forEach((descriptor, index) => {
    const { role, path, method } = descriptor;

    rules.push({
      id: `users-route-${index}`,
      role,
      descriptor: { path, method },
    });
  });

  return rules;
}
