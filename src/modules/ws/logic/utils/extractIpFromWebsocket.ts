import type { IncomingMessage } from 'node:http';

export function extractIpFromWebsocket(req: IncomingMessage) {
  const isXForwardedForHeaderPresent = req?.headers?.['x-forwarded-for'];

  if (isXForwardedForHeaderPresent && typeof isXForwardedForHeaderPresent === 'string') {
    const ipFromXForwardedForHeader = isXForwardedForHeaderPresent.split(',')[0]?.trim();
    return ipFromXForwardedForHeader;
  }

  const ipFromSocket = req.socket.remoteAddress;

  return ipFromSocket;
}
