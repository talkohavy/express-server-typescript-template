import type { TopicMessage } from '@src/lib/websocket-manager';

export type InterceptorFunc = (message: TopicMessage) => any;
