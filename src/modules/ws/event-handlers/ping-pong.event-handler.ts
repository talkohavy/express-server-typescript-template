import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { WsConnectionContext, IConnectionPipeline } from '../types';
import type { WebSocket } from 'ws';

export class PingPongEventHandler implements IConnectionPipeline {
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private readonly heartbeatIntervalMs = 30_000;

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    this.registerSocketToPingPong(socket);
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
    const isAlive = this.isAliveBySocket.get(socket);

    if (!isAlive) return void socket.terminate();

    this.isAliveBySocket.set(socket, false);

    socket.ping();
  }
}
