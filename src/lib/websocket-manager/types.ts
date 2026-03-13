export type ServerSocketResponse = {
  type: string;
  message?: string;
};

export type TopicMessage<T = any> = {
  topic: string;
  data: T;
  timestamp?: number;
};
