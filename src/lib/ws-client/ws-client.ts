import { WebSocket, WebSocketServer } from 'ws';
import type { BroadcastToAllButSelfProps, BroadcastToAllProps } from './ws-client.interface';

export class WebsocketClient {
  readonly wss: WebSocketServer;

  constructor(options: ConstructorParameters<typeof WebSocketServer>[0]) {
    this.wss = new WebSocketServer(options);
  }

  /**
   * Broadcast a message to all connected clients that are open.
   */
  broadcastToAll(props: BroadcastToAllProps): void {
    const { data, options } = props;
    const { binary: isBinary = false } = options ?? {};

    this.wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
  }

  /**
   * Broadcast a message to all connected clients that are open.
   */
  broadcastToAllButSelf(props: BroadcastToAllButSelfProps): void {
    const { self, data, options } = props;
    const { binary: isBinary = false } = options ?? {};

    this.wss.clients.forEach((client) => {
      if (client !== self && client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
  }
}
