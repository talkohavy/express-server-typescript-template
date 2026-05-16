import type { SocketEventValues } from '@src/modules/ws/logic/constants';

/**
 * Contract between the client and the server.
 *
 * Two important notes when publishing a message to a topic:
 *
 * 1. The payload must be a TopicPayload.
 * 2. Only the payload property is sent to the server. The event property is stripped from the message.
 */
export type ClientMessage<T = any> = {
  event: SocketEventValues;
  payload?: T;
};

/**
 * The payload of a message published to a topic.
 */
export type TopicPayload<T = unknown> = {
  topic: string;
  data: T;
  timestamp?: number;
};

export type TopicMessage = Required<ClientMessage<TopicPayload>>;
