/**
 * Core RBAC types for a flexible, production-grade permission system.
 *
 * Supports:
 * - Route-based: permission per HTTP method + path pattern
 * - Resource-based: permission per resource type (users, books, etc.)
 * - Action-based: permission per action (create, read, update, delete, or custom)
 * - Role-based: users have roles, roles map to permissions
 */

/** Predefined roles. Extend in config for custom roles. */
export type Role = string;

/** HTTP methods that can be restricted */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type PermissionDescriptor = {
  method: HttpMethod;
  path: string;
};

/**
 * Context extracted from a request for permission evaluation.
 */
export type PermissionContext = {
  /**
   * Authenticated user (from req.user)
   */
  user?: { id: string; role?: Role; [key: string]: unknown };
  method: HttpMethod;
  /**
   * Request path (e.g. /api/users/123)
   */
  path: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
};

/**
 * Result of a permission check.
 */
export type PermissionCheckResult = { isAllowed: true } | { isAllowed: false; reason: string };

/**
 * Configuration for a single permission rule.
 */
export type PermissionRule = {
  /**
   * Unique rule id
   */
  id: string;
  /**
   * Role this rule applies to
   */
  role: Role;
  /**
   * What is being granted
   */
  descriptor: PermissionDescriptor;
  /**
   * Optional: custom condition key for external evaluators
   */
  condition?: string;
};

/**
 * Full permission configuration.
 */
export type PermissionConfig = {
  /**
   * Role-to-permission rules
   */
  rules: PermissionRule[];
  /**
   * Optional: custom permission evaluators by condition key
   */
  customEvaluators?: Record<string, (props: { context: PermissionContext; rule: PermissionRule }) => Promise<boolean>>;
};
