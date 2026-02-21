import { randomUUID } from 'node:crypto';
import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/ws-client/logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketClient } from '@src/lib/ws-client';
import type { WebSocket } from 'ws';

export class ConnectionEventHandler {
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private readonly heartbeatIntervalMs = 30_000;

  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {}

  private attachSocketIdToConnection(socket: WebSocket) {
    socket.id = randomUUID();
  }

  private registerSocketToPingPong(socket: WebSocket): void {
    this.isAliveBySocket.set(socket, true);

    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Pong, () => {
      this.isAliveBySocket.set(socket, true);
    });

    this.startPingPongInterval(socket);
  }

  private startPingPongInterval(socket: WebSocket): void {
    setInterval(() => this.pingClientAndTerminateIfUnresponsive(socket), this.heartbeatIntervalMs);
  }

  private pingClientAndTerminateIfUnresponsive(socket: WebSocket): void {
    const isAlive = !!this.isAliveBySocket.get(socket);

    if (!isAlive) return void socket.terminate(); // <--- Use `terminate()`, which immediately destroys the connection, instead of `close()`, which waits for the close timer.

    this.isAliveBySocket.set(socket, false);

    socket.ping();
  }

  private attachErrorHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Error, (error) => {
      this.logger.error('WebSocket error', { error });
    });
  }

  private attachCloseHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
      // Clean up all topic subscriptions for this client (fire-and-forget)
      this.wsClient.unsubscribeFromAllTopics(socket);
      this.logger.log('ws connection closed', { socketId: socket.id });
    });
  }

  registerEventHandlers(): void {
    this.wsClient.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket, _req) => {
      this.attachSocketIdToConnection(socket);

      this.registerSocketToPingPong(socket);

      this.attachErrorHandlerToSocket(socket);

      this.attachCloseHandlerToSocket(socket);
    });
  }
}
