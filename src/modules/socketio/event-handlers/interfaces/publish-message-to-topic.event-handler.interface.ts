export type SendMessageToTopicPayload<T = any> = {
  topic: string;
  data: T;
};
