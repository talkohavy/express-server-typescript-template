import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import type { SocketEventValues } from './logic/constants';

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

/**
 * The payload of a message published to a topic.
 */
export type TopicPayload<T = unknown> = {
  topic: string;
  data: T;
  timestamp?: number;
};

export type TopicMessage = Required<ClientMessage<TopicPayload>>;
