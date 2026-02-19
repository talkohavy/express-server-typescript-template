import { DEFAULT_TOPIC_KEY_TTL_SECONDS } from './constants';
import {
  CLEANUP_CONNECTIONS_SCRIPT,
  SUBSCRIBE_SCRIPT,
  UNSUBSCRIBE_ALL_SCRIPT,
  UNSUBSCRIBE_SCRIPT,
} from './redis-topic-scripts.lua';
import { getSocketsUnderTopicKey, getTopicsGroupKey, getTopicsUnderSocketKey } from './utils';
import type { RedisClientType } from 'redis';
import type { WebSocket } from 'ws';

/**
 * Manages topic subscriptions for WebSocket clients with Redis as the source of truth.
 * Horizontally scalable: each node only holds its local client connections in memory;
 * subscription state lives in Redis and all mutations are atomic via Lua scripts.
 *
 * In-memory only:
 * - socketId -> WebSocket (so this node can send to its local clients)
 */
export class TopicManager {
  /**
   * Local connections only: socketId -> WebSocket for this node.
   */
  private readonly socketIdToSocket = new Map<string, WebSocket>();

  constructor(private readonly redis: RedisClientType) {}

  /**
   * Subscribe a client to a topic. Registers the socket locally on first subscribe so getSubscribers can resolve it.
   * @returns true if newly subscribed, false if already subscribed.
   */
  async subscribe(socket: WebSocket, topic: string): Promise<boolean> {
    const socketId = socket.id;

    if (!socketId) return false;

    this.socketIdToSocket.set(socketId, socket);

    const socketsUnderTopicKey = getSocketsUnderTopicKey(topic);
    const topicsUnderSocketKey = getTopicsUnderSocketKey(socketId);
    const topicsGroupKey = getTopicsGroupKey();
    const ttl = String(DEFAULT_TOPIC_KEY_TTL_SECONDS);

    const result = await this.eval(
      SUBSCRIBE_SCRIPT,
      3,
      [socketsUnderTopicKey, topicsUnderSocketKey, topicsGroupKey],
      [socketId, topic, ttl],
    );

    return result === 1;
  }

  /**
   * Unsubscribe a client from a topic.
   * @returns true if was subscribed and removed, false otherwise.
   */
  async unsubscribe(socket: WebSocket, topic: string): Promise<boolean> {
    const socketId = socket.id;

    if (!socketId) return false;

    const socketsUnderTopicKey = getSocketsUnderTopicKey(topic);
    const topicsUnderSocketKey = getTopicsUnderSocketKey(socketId);
    const topicsGroupKey = getTopicsGroupKey();
    const ttl = String(DEFAULT_TOPIC_KEY_TTL_SECONDS);

    const result = await this.eval(
      UNSUBSCRIBE_SCRIPT,
      3,
      [socketsUnderTopicKey, topicsUnderSocketKey, topicsGroupKey],
      [socketId, topic, ttl],
    );

    return result === 1;
  }

  /**
   * Unsubscribe a client from all topics (e.g. on disconnect).
   * Removes the client from local maps after clearing Redis.
   */
  async unsubscribeAll(socket: WebSocket): Promise<void> {
    const socketId = socket.id;

    if (!socketId) return;

    const topicsUnderSocketKey = getTopicsUnderSocketKey(socketId);
    const topicsGroupKey = getTopicsGroupKey();
    const ttl = String(DEFAULT_TOPIC_KEY_TTL_SECONDS);

    await this.eval(UNSUBSCRIBE_ALL_SCRIPT, 2, [topicsUnderSocketKey, topicsGroupKey], [socketId, ttl]);

    this.socketIdToSocket.delete(socketId);
  }

  /**
   * Returns only the local WebSocket clients that are subscribed to the topic.
   * Other nodes have their own local subscribers; each node sends only to its own.
   */
  async getSubscribers(topic: string): Promise<Set<WebSocket>> {
    const socketsUnderTopicKey = getSocketsUnderTopicKey(topic);

    const socketIds = await this.redis.sMembers(socketsUnderTopicKey);

    const subscribedSockets = new Set<WebSocket>();

    socketIds.forEach((id) => {
      const socket = this.socketIdToSocket.get(id);

      if (socket == null) return;

      subscribedSockets.add(socket);
    });

    return subscribedSockets;
  }

  /**
   * Topics this client is subscribed to (from Redis).
   */
  async getClientTopics(socket: WebSocket): Promise<Set<string>> {
    const socketId = socket.id;

    if (!socketId) return new Set<string>();

    const topicsUnderSocketKey = getTopicsUnderSocketKey(socketId);
    const topicsOfSocket = await this.redis.sMembers(topicsUnderSocketKey);

    return new Set(topicsOfSocket);
  }

  async isSubscribed(socket: WebSocket, topic: string): Promise<boolean> {
    const socketId = socket.id;

    if (!socketId) return false;

    const socketsUnderTopicKey = getSocketsUnderTopicKey(topic);

    const isSubscribedToTopic = await this.redis.sIsMember(socketsUnderTopicKey, socketId);

    return Boolean(isSubscribedToTopic);
  }

  /**
   * Total number of topics (across all nodes).
   */
  async getTopicCount(): Promise<number> {
    const topicsGroupKey = getTopicsGroupKey();

    const topicsCount = await this.redis.sCard(topicsGroupKey);

    return topicsCount;
  }

  /**
   * All topic names (across all nodes).
   */
  async getTopicNames(): Promise<string[]> {
    const topicsGroupKey = getTopicsGroupKey();

    const topicNames = await this.redis.sMembers(topicsGroupKey);

    return topicNames;
  }

  /**
   * Total subscriber count for a topic (across all nodes).
   */
  async getSubscriberCount(topic: string): Promise<number> {
    const socketsUnderTopicKey = getSocketsUnderTopicKey(topic);

    const subscribersCount = await this.redis.sCard(socketsUnderTopicKey);

    return subscribersCount;
  }

  /**
   * Remove all Redis keys for the given connection IDs (this node's connections).
   * Use on shutdown so this process's keys are removed from Redis.
   */
  async removeConnectionsFromRedis(socketIds: string[]): Promise<void> {
    if (socketIds.length === 0) return;

    const topicsGroupKey = getTopicsGroupKey();
    const keys = [topicsGroupKey, ...socketIds.map(getTopicsUnderSocketKey)];
    const ttl = String(DEFAULT_TOPIC_KEY_TTL_SECONDS);

    await this.eval(CLEANUP_CONNECTIONS_SCRIPT, keys.length, keys, [ttl, ...socketIds]);
  }

  /**
   * Remove from Redis all keys for connections that belong to this node (local connections).
   * Call on server shutdown so this process does not leave stale keys in Redis.
   */
  async removeAllLocalConnectionsFromRedis(): Promise<void> {
    const socketIds = Array.from(this.socketIdToSocket.keys());

    await this.removeConnectionsFromRedis(socketIds);
  }

  /**
   * Run a Lua script via EVAL. Uses sendCommand for EVAL so we don't depend on scriptLoad.
   */
  private async eval(script: string, numKeys: number, keys: string[], args: string[]): Promise<number> {
    const cmd = ['EVAL', script, String(numKeys), ...keys, ...args];

    const result = await this.redis.sendCommand(cmd);

    if (typeof result === 'number') return result;

    if (typeof result === 'string') return Number(result);

    return 0;
  }
}
