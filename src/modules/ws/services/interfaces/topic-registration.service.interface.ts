import type { Actions } from '../logic/constants';
import type WebSocket from 'ws';

export type TopicRegistrationPayload = {
  action: typeof Actions.Register;
  topic: string;
};

export type TopicUnregisterPayload = {
  action: typeof Actions.Unregister;
  topic: string;
};

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
