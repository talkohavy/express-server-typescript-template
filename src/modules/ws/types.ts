import type { WebSocket } from 'ws';

export type ActionHandler = (ws: WebSocket, payload: any) => Promise<void>;

/**
 * Contract for all client WebSocket messages.
 * Messages must be stringified JSON and include an "event" key (Socket.IO-style).
 */
export type ClientMessage = {
  event: string;
  payload?: unknown;
};

/**
 * Domain handler invoked by the message dispatcher for a specific event name.
 */
export type MessageHandler = (socket: WebSocket, payload: unknown) => Promise<void>;
