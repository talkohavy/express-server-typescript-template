import type { Actions } from '../logic/constants';
import type WebSocket from 'ws';

export type HandleSendMessagePayload = {
  action: typeof Actions.Send;
  topic: string;
  /**
   * Message contents sent to all subscribers of the topic.
   */
  data: Record<string, unknown>;
};

export type SendResponseProps = {
  socket: WebSocket;
  type: string;
  message?: string;
};
