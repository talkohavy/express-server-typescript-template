import type WebSocket from 'ws';

export type ActionMessageData = {
  topic: string;
  payload: {
    action: string;
    [key: string]: unknown;
  };
};

export type TopicRegistrationPayload = {
  topic: string;
};

export type TopicUnregisterPayload = {
  topic: string;
};

export type SendResponseProps = {
  ws: WebSocket;
  type: string;
  message?: string;
};
