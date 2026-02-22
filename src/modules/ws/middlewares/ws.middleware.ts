import { randomUUID } from 'node:crypto';
import { BUILT_IN_WEBSOCKET_EVENTS } from '../../../lib/websocket-manager';
import type { WebSocket, WebSocketServer } from 'ws';

export class WsMiddleware {
  constructor(private readonly wsApp: WebSocketServer) {}

  private attachSocketIdToConnection(socket: WebSocket) {
    socket.id = randomUUID();
  }

  public use() {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket: WebSocket) => {
      this.attachSocketIdToConnection(socket);
    });
  }
}
