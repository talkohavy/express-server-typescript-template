export { WebsocketClient } from './ws-client';

// constants
export { TopicManager } from './logic/topic-manager';
export { BUILT_IN_WEBSOCKET_EVENTS } from './logic/constants';

// types
export type { ServerSocketResponse, TopicMessage } from './types';
export type {
  WebsocketClientConfig,
  BroadcastToAllProps,
  BroadcastToAllButSelfProps,
  PublishToTopicProps,
} from './ws-client.interface';
