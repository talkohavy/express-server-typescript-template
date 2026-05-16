import type { TopicPayload } from '../../types';

export type ServerSocketResponse = {
  type: string;
  message?: string;
};

export type InterceptorFunc = (message: TopicPayload) => any;
