import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

/**
 * Per-connection context passed through the WebSocket connection pipeline (single ordered chain).
 */
export type WsConnectionContext = {
  socket: WebSocket;
  request: IncomingMessage;
};

/**
 * One step in the connection pipeline; each step completes before the next runs.
 */
export interface IConnectionPipeline {
  handleConnection(props: WsConnectionContext): Promise<void> | void;
}

export type ActionHandler = (socket: WebSocket, payload: any) => Promise<void>;

export type WsMiddleware = (socket: WebSocket, payload: any, next: () => void) => Promise<void> | void;
