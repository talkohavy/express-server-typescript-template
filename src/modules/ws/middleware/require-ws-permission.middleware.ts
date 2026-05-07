import { sendPermissionDeniedResponse } from '../logic/utils/sendPermissionDeniedResponse';
import type { ActionHandler } from '../types';
import type { WebSocket } from 'ws';

type RequireWsPermissionMiddlewareProps = {
  requiredPermissions: string[];
  handler: ActionHandler;
};

export function requireWsPermissionMiddleware(props: RequireWsPermissionMiddlewareProps): ActionHandler {
  const { handler, requiredPermissions } = props;

  return async (socket: WebSocket, payload: unknown) => {
    const isAllowed = await checkPermission({ socket, requiredPermissions });

    if (!isAllowed) {
      sendPermissionDeniedResponse(socket);
      return;
    }

    await handler(socket, payload);
  };
}

type CheckPermissionProps = {
  socket: WebSocket;
  requiredPermissions: string[];
};

async function checkPermission(_props: CheckPermissionProps): Promise<boolean> {
  // Add your permission logic here (e.g. check socket roles, topic ownership, JWT claims, etc.)
  return true;
}
