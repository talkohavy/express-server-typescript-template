import { WS_TOPIC_PUBSUB_CHANNEL } from './logic/constants';
import type { TopicManager } from './logic/topic-manager';
import type { TopicMessage } from './types';
import type { PublishToTopicProps } from './websocket-manager.interface';
import type { RedisClientType } from 'redis';
import type { WebSocket } from 'ws';

export class WebsocketManager {
  /**
   * @param redisPub Used to PUBLISH topic messages to the shared channel (and for TopicManager: subscription state).
   */
  constructor(
    private readonly topicManager: TopicManager,
    private readonly redisPub: RedisClientType,
  ) {}

  /**
   * Publishes a message to a topic via Redis pub/sub. Every node (including this one) receives it
   * and forwards to its local WebSocket clients subscribed to the topic.
   * @returns The number of Redis subscriber nodes that received the message.
   */
  async publishToTopic(props: PublishToTopicProps): Promise<number> {
    const { topic, data } = props;

    const messageRaw: TopicMessage = { topic, data };
    const messageStringified = JSON.stringify(messageRaw);

    const subscriberCount = await this.redisPub.publish(WS_TOPIC_PUBSUB_CHANNEL, messageStringified);

    return subscriberCount;
  }

  async subscribeToTopic(client: WebSocket, topic: string): Promise<boolean> {
    return this.topicManager.subscribe(client, topic);
  }

  async unsubscribeFromTopic(client: WebSocket, topic: string): Promise<boolean> {
    return this.topicManager.unsubscribe(client, topic);
  }

  /**
   * Unsubscribe a client from all topics (should be called on disconnect).
   */
  async unsubscribeFromAllTopics(client: WebSocket): Promise<void> {
    return this.topicManager.unsubscribeClientFromAllTopics(client);
  }

  async getClientTopics(client: WebSocket): Promise<Set<string>> {
    return this.topicManager.getClientTopics(client);
  }

  async isClientSubscribed(client: WebSocket, topic: string): Promise<boolean> {
    return this.topicManager.isSubscribed(client, topic);
  }

  async getTopicSubscriberCount(topic: string): Promise<number> {
    return this.topicManager.getSubscriberCount(topic);
  }

  async getTopicCount(): Promise<number> {
    return this.topicManager.getTopicCount();
  }

  async getTopicNames(): Promise<string[]> {
    return this.topicManager.getTopicNames();
  }

  /**
   * Returns only the local WebSocket clients that are subscribed to the topic.
   * Used by ConsumeMessageFromTopicService to forward messages to this node's clients.
   */
  async getTopicSubscribers(topic: string): Promise<Set<WebSocket>> {
    return this.topicManager.getTopicSubscribers(topic);
  }

  /**
   * Remove from Redis all keys created by this server's WebSocket connections.
   * Should be called on shutdown (graceful or unexpected).
   */
  async cleanup(): Promise<void> {
    try {
      await this.topicManager.removeAllLocalConnectionsFromRedis();
    } catch (error) {
      console.log('Redis WS cleanup failed during graceful shutdown');
      console.error(error);
    }
  }
}
