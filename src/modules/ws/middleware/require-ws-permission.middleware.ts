import { sendPermissionDeniedResponse } from '../logic/utils/sendPermissionDeniedResponse';
import type { WebSocket } from 'ws';

export async function requireWsPermissionMiddleware(socket: WebSocket, _payload: unknown, next: () => void) {
  const isAllowed = await checkPermission({ socket, requiredPermissions: ['allow_publish_to_topic'] });

  if (!isAllowed) {
    sendPermissionDeniedResponse(socket);
    return;
  }

  next();
}

type CheckPermissionProps = {
  socket: WebSocket;
  requiredPermissions: string[];
};

async function checkPermission(_props: CheckPermissionProps): Promise<boolean> {
  // Add your permission logic here (e.g. check socket roles, topic ownership, JWT claims, etc.)
  return true;
}
