import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { WebSocket, WebSocketServer } from 'ws';

export class PingPongEventHandler {
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private readonly heartbeatIntervalMs = 30_000;

  constructor(private readonly wsApp: WebSocketServer) {}

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

    if (!isAlive) return void socket.terminate();

    this.isAliveBySocket.set(socket, false);

    socket.ping();
  }

  registerEventHandlers(): void {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket, _req) => {
      this.registerSocketToPingPong(socket);
    });
  }
}
