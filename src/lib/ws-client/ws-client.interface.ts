import type { WebSocketServer } from 'ws';
import type WebSocket from 'ws';

export type HeartbeatConfig = {
  /**
   * Interval in ms between ping rounds.
   *
   * Clients that don't pong in time are terminated.
   *
   * @default 30000
   */
  intervalMs?: number;
};

export type WebSocketServerOptions = ConstructorParameters<typeof WebSocketServer>[0];
export type WebsocketClientConfig = { heartbeat?: HeartbeatConfig };

type BroadcastOptions = {
  binary?: boolean;
};

export type BroadcastToAllProps = {
  data: string | Buffer | ArrayBufferView;
  options?: BroadcastOptions;
};

export type BroadcastToAllButSelfProps = {
  self: WebSocket;
  data: string | Buffer | ArrayBufferView;
  options?: BroadcastOptions;
};
