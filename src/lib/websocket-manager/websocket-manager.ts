import { WebSocket } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { WS_TOPIC_PUBSUB_CHANNEL } from './logic/constants';
import type { TopicManager } from './logic/topic-manager';
import type { TopicMessage } from './types';
import type { PublishToTopicProps } from './websocket-manager.interface';
import type { RedisClientType } from 'redis';

export class WebsocketManager {
  /**
   * @param redisPub Used to PUBLISH topic messages to the shared channel (and for TopicManager: subscription state).
   * @param redisSub Used only to SUBSCRIBE to that channel so this node receives messages and can forward them to local clients.
   */
  constructor(
    private readonly topicManager: TopicManager,
    private readonly redisPub: RedisClientType,
    private readonly redisSub: RedisClientType,
  ) {
    this.subscribeToPubSubTopicsChannel();
  }

  /**
   * Publishes a message to a topic via Redis pub/sub. Every node (including this one) receives it
   * and forwards to its local WebSocket clients subscribed to the topic.
   * @returns The number of Redis subscriber nodes that received the message.
   */
  async publishToTopic(props: PublishToTopicProps): Promise<number> {
    const { topic, payload } = props;

    const messageRaw: TopicMessage = { topic, payload, timestamp: Date.now() };
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
   * Remove from Redis all keys created by this server's WebSocket connections, unsubscribe from topic pub/sub,
   * and stop the heartbeat interval. Should be called on shutdown (graceful or unexpected).
   */
  async cleanup(): Promise<void> {
    try {
      await this.redisSub.unsubscribe(WS_TOPIC_PUBSUB_CHANNEL);
      await this.topicManager.removeAllLocalConnectionsFromRedis();
    } catch (error) {
      console.log('Redis WS cleanup failed during graceful shutdown');
      console.error(error);
    }
  }

  /**
   * Subscribes to the Redis topic channel. When a message is published by any node (even this one),
   * this node receives it and forwards to its local WebSocket clients subscribed to that topic.
   */
  private async subscribeToPubSubTopicsChannel(): Promise<void> {
    await this.redisSub.subscribe(WS_TOPIC_PUBSUB_CHANNEL, (message) => {
      this.forwardTopicMessageToLocalClients(message);
    });
  }

  /**
   * Called when a topic message is received from Redis. Forwards the message to local clients subscribed to the topic.
   */
  private async forwardTopicMessageToLocalClients(message: string) {
    const parsedMessage = parseJson<TopicMessage>(message);

    if (!parsedMessage) {
      console.error('WS topic pub/sub: invalid JSON received on channel', WS_TOPIC_PUBSUB_CHANNEL);
      return;
    }

    const { topic } = parsedMessage;

    const topicSubscribers = await this.topicManager.getTopicSubscribers(topic);

    topicSubscribers.forEach((socket) => {
      if (socket.readyState !== WebSocket.OPEN) return;

      try {
        socket.send(message, { binary: false });
      } catch (error) {
        console.error(`Failed to send topic message to client in topic "${topic}":`, error);
      }
    });
  }
}
