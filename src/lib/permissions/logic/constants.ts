export const RoleTypes = {
  Guest: 'guest',
  User: 'user',
  Admin: 'admin',
} as const;

export type RoleTypeValues = (typeof RoleTypes)[keyof typeof RoleTypes];
