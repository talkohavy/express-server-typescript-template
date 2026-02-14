/**
 * Matches request path against a pattern with params.
 * e.g. pattern "/api/users/:userId" matches "/api/users/123" with params { userId: "123" }
 */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart!.startsWith(':')) {
      const paramName = patternPart!.slice(1);
      params[paramName] = pathPart ?? '';
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}
