import { RoleTypes } from '../logic/constants';
import { matchPath } from '../logic/utils/path-matcher';
import type { PermissionCheckResult, PermissionConfig, PermissionContext, PermissionRule } from '../types';
import type { HasRoleProps } from './permission-checker.service.interface';

/**
 * Core service for evaluating permissions against a context.
 * Stateless and configurable.
 */
export class PermissionCheckerService {
  constructor(private readonly config: PermissionConfig) {}

  /**
   * Check if the given context is allowed.
   * Returns { isAllowed: true } or { isAllowed: false, reason }.
   */
  async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    const userRole = context.user?.role ?? RoleTypes.Guest;

    const matchingRules = this.getMatchingRules(context);

    if (matchingRules.length === 0) {
      return { isAllowed: false, reason: `No permission rule for ${context.method} ${context.path}` };
    }

    for (const rule of matchingRules) {
      if (rule.condition && this.config.customEvaluators?.[rule.condition]) {
        const evaluator = this.config.customEvaluators[rule.condition]!;

        const customResult = await evaluator({ context, rule });

        if (!customResult) {
          return { isAllowed: false, reason: `Custom condition failed: ${rule.condition}` };
        }
      }

      return { isAllowed: true };
    }

    return { isAllowed: false, reason: `Role '${userRole}' has no permission for this request` };
  }

  /**
   * Check if user has one of the given roles.
   */
  hasRole(props: HasRoleProps): boolean {
    const { context, roles } = props;

    const userRole = context.user?.role ?? RoleTypes.Guest;

    return roles.includes(userRole);
  }

  private getMatchingRules(context: PermissionContext): PermissionRule[] {
    return this.config.rules.filter((rule) => this.ruleMatchesContext(rule, context));
  }

  private ruleMatchesContext(rule: PermissionRule, context: PermissionContext): boolean {
    const { role, descriptor } = rule;

    const isRoleMatch = context.user?.role === role;
    const isMethodMatch = descriptor.method === context.method;
    const isPathMatch = matchPath(descriptor.path, context.path) !== null;

    const isMatch = isRoleMatch && isMethodMatch && isPathMatch;

    return isMatch;
  }
}
