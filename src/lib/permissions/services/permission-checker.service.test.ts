import { buildUsersPermissionRules } from '../../../modules/users/permissions/users.permissions';
import { PermissionCheckerService } from './permission-checker.service';

describe('PermissionCheckerService', () => {
  const config = { rules: buildUsersPermissionRules() };
  const checker = new PermissionCheckerService(config);

  describe('checkPermission - route based', () => {
    it('allows guest to POST /api/users (registration)', async () => {
      const expectedResult = { isAllowed: true };
      const actualResult = await checker.checkPermission({
        user: undefined,
        method: 'POST',
        path: '/api/users',
        params: {},
      });
      expect(actualResult).toEqual(expectedResult);
    });

    it('denies guest to GET /api/users (list)', async () => {
      const actualResult = await checker.checkPermission({
        user: undefined,
        method: 'GET',
        path: '/api/users',
        params: {},
      });
      expect(actualResult.isAllowed).toBe(false);
    });

    it('allows admin to GET /api/users', async () => {
      const expectedResult = { isAllowed: true };
      const actualResult = await checker.checkPermission({
        user: { id: '1', role: 'admin' },
        method: 'GET',
        path: '/api/users',
        params: {},
      });
      expect(actualResult).toEqual(expectedResult);
    });

    it('allows user to GET own profile', async () => {
      const expectedResult = { isAllowed: true };
      const actualResult = await checker.checkPermission({
        user: { id: '42', role: 'user' },
        method: 'GET',
        path: '/api/users/42',
        params: { userId: '42' },
      });
      expect(actualResult).toEqual(expectedResult);
    });

    it('denies user to GET another user profile', async () => {
      const actualResult = await checker.checkPermission({
        user: { id: '1', role: 'user' },
        method: 'GET',
        path: '/api/users/99',
        params: { userId: '99' },
      });
      expect(actualResult.isAllowed).toBe(false);
    });

    it('allows admin to DELETE any user', async () => {
      const expectedResult = { isAllowed: true };
      const actualResult = await checker.checkPermission({
        user: { id: '1', role: 'admin' },
        method: 'DELETE',
        path: '/api/users/99',
        params: { userId: '99' },
      });
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('hasRole', () => {
    it('returns true when user has one of the roles', () => {
      const context = { user: { id: '1', role: 'admin' }, method: 'GET' as const, path: '/' };
      const actualResult = checker.hasRole({ context, roles: ['admin', 'user'] });
      expect(actualResult).toBe(true);
    });

    it('returns false when user has different role', () => {
      const context = { user: { id: '1', role: 'guest' }, method: 'GET' as const, path: '/' };
      const actualResult = checker.hasRole({ context, roles: ['admin', 'user'] });
      expect(actualResult).toBe(false);
    });
  });
});
