import type WebSocket from 'ws';

export type ActionMessageData = {
  topic: string;
  payload: {
    action: string;
    [key: string]: unknown;
  };
};

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
