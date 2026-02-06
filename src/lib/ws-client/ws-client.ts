import { WebSocket, WebSocketServer } from 'ws';
import { BUILT_IN_WEBSOCKET_EVENTS } from './logic/constants';
import type {
  BroadcastToAllButSelfProps,
  BroadcastToAllProps,
  WebsocketClientConfig,
  WebSocketServerOptions,
} from './ws-client.interface';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

export class WebsocketClient {
  readonly wss: WebSocketServer;
  private readonly heartbeatIntervalMs: number;
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options: WebSocketServerOptions, customConfig?: WebsocketClientConfig) {
    this.wss = new WebSocketServer(options);

    const { heartbeat: heartbeatConfig } = customConfig ?? {};
    const { intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS } = heartbeatConfig ?? {};

    this.heartbeatIntervalMs = intervalMs > 0 ? intervalMs : 0;

    const isHeartbeatEnabled = this.heartbeatIntervalMs > 0;

    if (isHeartbeatEnabled) this.addHeartbeatMechanism();
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
      if (client === self || client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
  }

  private addHeartbeatMechanism(): void {
    this.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, this.listenForHeartbeat);

    this.pingIntervalId = setInterval(() => this.pingClientsAndTerminateUnresponsive(), this.heartbeatIntervalMs);

    this.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => this.clearPingInterval());
  }

  /**
   * Mark the connection as alive on pong; used by the heartbeat to detect broken connections.
   */
  private listenForHeartbeat(ws: WebSocket): void {
    this.isAliveBySocket.set(ws, true);

    ws.on(BUILT_IN_WEBSOCKET_EVENTS.Pong, () => {
      this.isAliveBySocket.set(ws, true);
    });
  }

  /**
   * Ping all clients; terminate any that didn't pong since the previous round.
   */
  private pingClientsAndTerminateUnresponsive(): void {
    this.wss.clients.forEach((ws) => {
      const isAlive = !!this.isAliveBySocket.get(ws);

      if (!isAlive) return void ws.terminate();

      this.isAliveBySocket.set(ws, false);

      ws.ping();
    });
  }

  private clearPingInterval(): void {
    if (this.pingIntervalId === null) return;

    clearInterval(this.pingIntervalId);
    this.pingIntervalId = null;
  }
}
