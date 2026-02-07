export type ServerSocketResponse = {
  type: string;
  message?: string;
};

export type TopicMessage = {
  topic: string;
  payload: unknown;
  timestamp?: number;
};
