import type { TopicMessage } from '../../../../lib/websocket-manager';

export type InterceptorFunc = (message: TopicMessage) => any;
