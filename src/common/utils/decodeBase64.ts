export function decodeBase64(str: string) {
  // atob is incorrectly being marked as deprecated! source: https://github.com/microsoft/TypeScript/issues/45566
  return decodeURIComponent(atob(str));
}
