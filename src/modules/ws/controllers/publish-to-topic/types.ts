import type { TopicMessage } from '@src/lib/websocket-manager';

export type HandleSendMessagePayload<T = any> = TopicMessage<T>;
