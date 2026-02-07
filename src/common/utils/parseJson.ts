export function parseJson<T>(data: Buffer | string): T | null {
  try {
    const message = JSON.parse(data.toString());

    return message;
  } catch {
    return null;
  }
}
