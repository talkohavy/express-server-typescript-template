import type { TopicPayload } from '@src/lib/websocket-manager';

export type InterceptorFunc = (message: TopicPayload) => any;
