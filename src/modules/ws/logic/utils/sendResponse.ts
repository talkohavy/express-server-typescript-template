import type { ServerSocketResponse } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};

export function sendResponse(props: SendResponseProps): void {
  const { socket, type, message } = props;

  if (socket.readyState !== socket.OPEN) return;

  const response: ServerSocketResponse = { type, message };

  socket.send(JSON.stringify(response));
}
