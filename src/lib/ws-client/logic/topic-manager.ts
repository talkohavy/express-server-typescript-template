import {
  getConnectionKey,
  getTopicsSetKey,
  SUBSCRIBE_SCRIPT,
  getTopicKey,
  UNSUBSCRIBE_ALL_SCRIPT,
  UNSUBSCRIBE_SCRIPT,
} from './redis-topic-scripts.lua';
import type { RedisClientType } from 'redis';
import type { WebSocket } from 'ws';

/**
 * Manages topic subscriptions for WebSocket clients with Redis as the source of truth.
 * Horizontally scalable: each node only holds its local client connections in memory;
 * subscription state lives in Redis and all mutations are atomic via Lua scripts.
 *
 * In-memory only:
 * - connectionId -> WebSocket (so this node can send to its local clients)
 * - WebSocket -> connectionId (for unsubscribe / unsubscribeAll by client)
 */
export class TopicManager {
  /**
   * Local connections only: connectionId -> WebSocket for this node.
   */
  private readonly connectionIdToSocket = new Map<string, WebSocket>();

  constructor(private readonly redis: RedisClientType) {}

  /**
   * Subscribe a client to a topic. Registers the socket locally on first subscribe so getSubscribers can resolve it.
   * @returns true if newly subscribed, false if already subscribed.
   */
  async subscribe(socket: WebSocket, topic: string): Promise<boolean> {
    const connectionId = socket.id;

    if (!connectionId) return false;

    this.connectionIdToSocket.set(connectionId, socket);

    const topicKeyStr = getTopicKey(topic);
    const connectionKeyStr = getConnectionKey(connectionId);
    const topicsSet = getTopicsSetKey();

    const result = await this.eval(
      SUBSCRIBE_SCRIPT,
      3,
      [topicKeyStr, connectionKeyStr, topicsSet],
      [connectionId, topic],
    );

    return result === 1;
  }

  /**
   * Unsubscribe a client from a topic.
   * @returns true if was subscribed and removed, false otherwise.
   */
  async unsubscribe(socket: WebSocket, topic: string): Promise<boolean> {
    const connectionId = socket.id;

    if (!connectionId) return false;

    const topicKeyStr = getTopicKey(topic);
    const connectionKeyStr = getConnectionKey(connectionId);
    const topicsSet = getTopicsSetKey();

    const result = await this.eval(
      UNSUBSCRIBE_SCRIPT,
      3,
      [topicKeyStr, connectionKeyStr, topicsSet],
      [connectionId, topic],
    );

    return result === 1;
  }

  /**
   * Unsubscribe a client from all topics (e.g. on disconnect).
   * Removes the client from local maps after clearing Redis.
   */
  async unsubscribeAll(socket: WebSocket): Promise<void> {
    const connectionId = socket.id;

    if (!connectionId) return;

    const connectionKeyStr = getConnectionKey(connectionId);
    const topicsSet = getTopicsSetKey();

    await this.eval(UNSUBSCRIBE_ALL_SCRIPT, 2, [connectionKeyStr, topicsSet], [connectionId]);

    this.connectionIdToSocket.delete(connectionId);
  }

  /**
   * Returns only the local WebSocket clients that are subscribed to the topic.
   * Other nodes have their own local subscribers; each node sends only to its own.
   */
  async getSubscribers(topic: string): Promise<Set<WebSocket>> {
    const topicKeyStr = getTopicKey(topic);

    const connectionIds = await this.redis.sMembers(topicKeyStr);

    const subscribedClients = new Set<WebSocket>();

    connectionIds.forEach((id) => {
      const ws = this.connectionIdToSocket.get(id);

      if (ws == null) return;

      subscribedClients.add(ws);
    });

    return subscribedClients;
  }

  /**
   * Topics this client is subscribed to (from Redis).
   */
  async getClientTopics(socket: WebSocket): Promise<Set<string>> {
    const connectionId = socket.id;

    if (!connectionId) return new Set<string>();

    const connKeyStr = getConnectionKey(connectionId);
    const topics = await this.redis.sMembers(connKeyStr);

    return new Set(topics);
  }

  async isSubscribed(socket: WebSocket, topic: string): Promise<boolean> {
    const connectionId = socket.id;

    if (!connectionId) return false;

    const topicKeyStr = getTopicKey(topic);

    const isMember = await this.redis.sIsMember(topicKeyStr, connectionId);

    return Boolean(isMember);
  }

  /**
   * Total number of topics (across all nodes).
   */
  async getTopicCount(): Promise<number> {
    const topicsSet = getTopicsSetKey();

    const count = await this.redis.sCard(topicsSet);

    return count;
  }

  /**
   * All topic names (across all nodes).
   */
  async getTopicNames(): Promise<string[]> {
    const topicsSet = getTopicsSetKey();

    const names = await this.redis.sMembers(topicsSet);

    return names;
  }

  /**
   * Total subscriber count for a topic (across all nodes).
   */
  async getSubscriberCount(topic: string): Promise<number> {
    const topicKeyStr = getTopicKey(topic);

    const count = await this.redis.sCard(topicKeyStr);

    return count;
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
