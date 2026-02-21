import { WebSocket, type WebSocketServer } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { BUILT_IN_WEBSOCKET_EVENTS, WS_TOPIC_PUBSUB_CHANNEL } from './logic/constants';
import type { TopicManager } from './logic/topic-manager';
import type { TopicMessage } from './types';
import type {
  BroadcastToAllButSelfProps,
  BroadcastToAllProps,
  PublishToTopicProps,
  WebsocketClientConfig,
} from './ws-client.interface';
import type { RedisClientType } from 'redis';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

export class WebsocketClient {
  private readonly heartbeatIntervalMs: number;
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * @param redisPub Used to PUBLISH topic messages to the shared channel (and for TopicManager: subscription state).
   * @param redisSub Used only to SUBSCRIBE to that channel so this node receives messages and can forward them to local clients.
   */
  constructor(
    private readonly wss: WebSocketServer,
    private readonly topicManager: TopicManager,
    private readonly redisPub: RedisClientType,
    private readonly redisSub: RedisClientType,
    customConfig?: WebsocketClientConfig,
  ) {
    const { heartbeat: heartbeatConfig } = customConfig ?? {};
    const { intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS } = heartbeatConfig ?? {};

    this.heartbeatIntervalMs = intervalMs > 0 ? intervalMs : 0;
    const isHeartbeatEnabled = this.heartbeatIntervalMs > 0;
    if (isHeartbeatEnabled) this.addHeartbeatMechanism();

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

  broadcastToAll(props: BroadcastToAllProps): void {
    const { data, options } = props;
    const { binary: isBinary = false } = options ?? {};

    this.wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
  }

  broadcastToAllButSelf(props: BroadcastToAllButSelfProps): void {
    const { self, data, options } = props;
    const { binary: isBinary = false } = options ?? {};

    this.wss.clients.forEach((client) => {
      if (client === self || client.readyState !== WebSocket.OPEN) return;

      client.send(data, { binary: isBinary });
    });
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
   * Remove from Redis all keys created by this server's WebSocket connections, and unsubscribe from topic pub/sub.
   * Should be called on shutdown (graceful or unexpected) so this process does not leave stale keys.
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

  private addHeartbeatMechanism(): void {
    this.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, this.listenForHeartbeat.bind(this));

    this.pingIntervalId = setInterval(() => this.pingClientsAndTerminateUnresponsive(), this.heartbeatIntervalMs);

    this.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => this.clearPingInterval());
  }

  /**
   * Mark the connection as alive on pong; used by the heartbeat to detect broken connections.
   */
  private listenForHeartbeat(ws: WebSocket): void {
    this.isAliveBySocket.set(ws, true);

    ws.on(BUILT_IN_WEBSOCKET_EVENTS.Pong, () => {
      this.isAliveBySocket.set(ws, true);
    });
  }

  /**
   * Ping all clients; terminate any that didn't pong since the previous round.
   */
  private pingClientsAndTerminateUnresponsive(): void {
    this.wss.clients.forEach((ws) => {
      const isAlive = !!this.isAliveBySocket.get(ws);

      if (!isAlive) return void ws.terminate(); // <--- Use `terminate()`, which immediately destroys the connection, instead of `close()`, which waits for the close timer.

      this.isAliveBySocket.set(ws, false);

      ws.ping();
    });
  }

  private clearPingInterval(): void {
    if (this.pingIntervalId === null) return;

    clearInterval(this.pingIntervalId);
    this.pingIntervalId = null;
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
