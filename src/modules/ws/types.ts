import type { SocketEventValues } from './logic/constants';
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
  handleConnection(props: WsConnectionContext): Promise<void>;
}

/**
 * Contract for all client WebSocket messages.
 * Messages must be stringified JSON and include an "event" key (Socket.IO-style).
 */
export type ClientMessage = {
  event: SocketEventValues;
  payload?: unknown;
};

export type ActionHandler = (socket: WebSocket, payload: any) => Promise<void>;
