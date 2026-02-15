export function encodeBase64(str: string) {
  // btoa is incorrectly being marked as deprecated! source: https://github.com/microsoft/TypeScript/issues/45566
  return btoa(encodeURIComponent(str));
}
