import { WebSocket, WebSocketServer } from 'ws';
import type { BroadcastOptions } from './ws-client.interface';

export class WebsocketClient {
  readonly wss: WebSocketServer;

  constructor(options: ConstructorParameters<typeof WebSocketServer>[0]) {
    this.wss = new WebSocketServer(options);
  }

  /**
   * Broadcast a message to all connected clients that are open.
   */
  broadcast(data: string | Buffer | ArrayBufferView, options?: BroadcastOptions): void {
    const isBinary = options?.binary ?? false;

    this.wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
  }
}
