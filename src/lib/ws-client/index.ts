export { WebsocketClient } from './ws-client';

// constants
export { STATIC_TOPICS } from './logic/constants';
export { TopicManager } from './logic/topic-manager';

// types
export type { ServerSocketResponse, TopicMessage } from './types';
export type {
  WebSocketServerOptions,
  WebsocketClientConfig,
  BroadcastToAllProps,
  BroadcastToAllButSelfProps,
  PublishToTopicProps,
} from './ws-client.interface';
