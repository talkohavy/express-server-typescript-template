import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

export function attachSocketIdToConnection(socket: WebSocket) {
  socket.id = randomUUID();
}
