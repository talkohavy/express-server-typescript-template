import type { TopicMessage } from '@src/lib/websocket-manager';
import type WebSocket from 'ws';

export type HandleSendMessagePayload<T = any> = TopicMessage<T>;

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
