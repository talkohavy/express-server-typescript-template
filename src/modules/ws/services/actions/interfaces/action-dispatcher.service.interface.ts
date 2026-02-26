import type WebSocket from 'ws';

/**
 * Payload for the "actions" event. Dispatched by the message dispatcher.
 */
export type ActionsEventPayload = {
  action: string;
  [key: string]: unknown;
};

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
