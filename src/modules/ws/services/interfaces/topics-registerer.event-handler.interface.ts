import type WebSocket from 'ws';

export type SendResponseProps = {
  ws: WebSocket;
  type: string;
  message?: string;
};
