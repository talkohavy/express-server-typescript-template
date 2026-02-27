import type { SocketEvents } from '../../logic/constants';
import type WebSocket from 'ws';

export type TopicRegistrationPayload = {
  event: typeof SocketEvents.Register;
  topic: string;
};

export type TopicUnregisterPayload = {
  event: typeof SocketEvents.Unregister;
  topic: string;
};

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
