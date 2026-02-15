# Permissions & RBAC

This guide describes the production-grade RBAC (Role-Based Access Control) system used for authorization checks across the application.

---

## Overview

The permissions system supports multiple authorization models:

- **Route-based** – Permission per HTTP method + path pattern
- **Resource-based** – Permission per resource type (e.g. `users`, `books`)
- **Action-based** – Permission per action (e.g. `create`, `read`, `update`, from body or derived)
- **Role-based** – Users have roles; roles map to permissions

---

## Architecture

```
src/lib/permissions/
├── types.ts                    # Core types (Role, Action, Resource, PermissionContext)
├── config/
│   └── default-permission-config.ts   # Default rules (extend per module)
├── services/
│   └── permission-checker.service.ts  # Core evaluation logic
├── guards/                     # Express middleware factories
│   ├── require-permission.guard.ts      # Route + context based
│   ├── require-role.guard.ts            # Role-based
│   ├── require-resource-action.guard.ts # Resource + action
│   └── require-action-from-body.guard.ts # Body.action based
├── middlewares/
│   └── attach-user-from-headers.middleware.ts  # X-User-Id, X-User-Role
└── utils/
    ├── context-extractor.ts    # Build PermissionContext from req
    └── path-matcher.ts        # Match path patterns with params
```

---

## Configuration

### Permission Config

Located in `src/lib/permissions/config/default-permission-config.ts`:

```typescript
export const defaultPermissionConfig: PermissionConfig = {
  rules: [
    { id: 'users-create', role: 'guest', descriptor: { type: 'route', method: 'POST', path: '/api/users' } },
    { id: 'users-list', role: 'admin', descriptor: { type: 'route', method: 'GET', path: '/api/users' } },
    { id: 'users-read-own', role: 'user', descriptor: { type: 'route', method: 'GET', path: '/api/users/:userId' } },
    // ...
  ],
};
```

### Custom Config

Pass custom config when registering the plugin:

```typescript
permissionsPlugin({
  config: {
    rules: [...defaultPermissionConfig.rules, ...myCustomRules],
    customEvaluators: {
      'isPremium': async ({ context }) => context.user?.isPremium === true,
    },
  },
})
```

---

## Guards

### 1. `createRequirePermissionGuard`

Route + context-based. Uses config rules to allow/deny.

```typescript
// Require auth (default)
const guard = createRequirePermissionGuard();
app.get('/api/users/:userId', guard, handler);

// Public route (e.g. registration)
const guard = createRequirePermissionGuard({ requireAuth: false });
app.post('/api/users', guard, handler);
```

### 2. `createRequireRoleGuard`

User must have one of the given roles.

```typescript
const guard = createRequireRoleGuard(['admin', 'moderator']);
app.delete('/api/users/:userId', guard, handler);
```

### 3. `createRequireResourceActionGuard`

Explicit resource + action check.

```typescript
const guard = createRequireResourceActionGuard({ resource: 'users', action: 'delete' });
app.delete('/api/users/:userId', guard, handler);
```

### 4. `createRequireActionFromBodyGuard`

Action comes from `req.body.action` (or custom key).

```typescript
const guard = createRequireActionFromBodyGuard({ actionKey: 'action', resource: 'orders' });
app.post('/api/orders', guard, handler);
// Body: { action: 'approve', orderId: '123' }
```

---

## Populating `req.user`

For permission checks to work, `req.user` must be set with at least `{ id, role }`.

### JWT (BFF / monolith)

Use `createAttachUserFromTokenMiddleware` (backend module):

```typescript
const attachUser = createAttachUserFromTokenMiddleware({ app, authAdapter });
app.use('/api/users', attachUser);
```

The JWT payload must include `id` and `role` (added during login).

### Forwarded headers (microservices)

When the BFF forwards requests, set headers:

- `X-User-Id`
- `X-User-Role`

Use `attachUserFromHeaders` middleware on the receiving service.

---

## Users Module Example

The Users module demonstrates production-grade RBAC:

1. **Roles** – `DatabaseUser` has `role: UserRole` (`admin` | `user` | `guest`)
2. **Migration** – `role` column added to `users` table
3. **JWT** – `role` included in token payload at login
4. **Guards** – `createRequirePermissionGuard` on all user routes
5. **Config** – Rules in `default-permission-config.ts` for users routes

---

## Extending for New Modules

1. Add rules to `default-permission-config.ts` (or pass custom config to plugin)
2. Add `createRequirePermissionGuard()` (or other guard) to route handlers
3. Ensure `req.user` is set before guards run (auth middleware or headers)

---

## Roles Reference

| Role  | Description                        |
| ----- | ---------------------------------- |
| guest | Unauthenticated (default)          |
| user  | Authenticated user (own resources) |
| admin | Full access                        |
