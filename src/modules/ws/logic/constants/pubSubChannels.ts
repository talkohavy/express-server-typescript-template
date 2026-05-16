/**
 * Redis channel used for pub/sub: when a message is published here,
 * every node forwards it to its local topic subscribers.
 */
export const WS_TOPIC_PUBSUB_CHANNEL = 'ws:topic:pubsub';
