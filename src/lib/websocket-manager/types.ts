export type ServerSocketResponse = {
  type: string;
  message?: string;
};

/**
 * The payload of a message published to a topic.
 */
export type TopicPayload<T = any> = {
  topic: string;
  data: T;
  timestamp?: number;
};
