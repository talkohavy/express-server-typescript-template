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
 * Contract between the client and the server.
 *
 * Two important notes when publishing a message to a topic:
 *
 * 1. The payload must be a TopicPayload.
 * 2. Only the payload property is sent to the server. The event property is stripped from the message.
 */
export type ClientMessage<T = any> = {
  event: SocketEventValues;
  payload?: T;
};

export type ActionHandler = (socket: WebSocket, payload: any) => Promise<void>;

export type WsMiddleware = (socket: WebSocket, payload: any, next: () => void) => Promise<void> | void;
