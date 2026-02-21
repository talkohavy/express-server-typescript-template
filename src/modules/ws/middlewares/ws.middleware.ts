import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

export class WsMiddleware {
  private attachSocketIdToConnection(socket: WebSocket) {
    socket.id = randomUUID();
  }

  public use() {
    return (socket: WebSocket) => {
      this.attachSocketIdToConnection(socket);
    };
  }
}
