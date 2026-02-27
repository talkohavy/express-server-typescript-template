import type { SocketEventValues } from './logic/constants';
import type { WebSocket } from 'ws';

/**
 * Contract for all client WebSocket messages.
 * Messages must be stringified JSON and include an "event" key (Socket.IO-style).
 */
export type ClientMessage = {
  event: SocketEventValues;
  payload?: unknown;
};

/**
 * Domain handler invoked by the message dispatcher for a specific event name.
 */
export type EventHandler = (socket: WebSocket, payload: any) => Promise<void>;
