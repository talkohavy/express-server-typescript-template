import { SUBSCRIBE_SCRIPT, UNSUBSCRIBE_SCRIPT, UNSUBSCRIBE_ALL_SCRIPT } from './redis-topic-scripts.lua';
import { TopicManager } from './topic-manager';
import type { RedisClientType } from 'redis';
import type { WebSocket } from 'ws';

/**
 * In-memory mock that mimics the Lua script behavior for unit tests.
 * Keeps Redis as the logical source of truth (same key layout and semantics).
 */
function createMockRedis(): RedisClientType & { sendCommand(args: unknown[]): Promise<unknown> } {
  const topicSets = new Map<string, Set<string>>(); // ws:topic:X -> Set<connectionId>
  const connSets = new Map<string, Set<string>>(); // ws:conn:X -> Set<topic>
  const topicsSet = new Set<string>(); // ws:topics

  function sendCommand(args: unknown[]): Promise<unknown> {
    const cmd = args as string[];
    if (cmd[0] !== 'EVAL') return Promise.resolve(0);

    const script = cmd[1];
    const numKeys = Number(cmd[2]);
    const keys = cmd.slice(3, 3 + numKeys);
    const argv = cmd.slice(3 + numKeys);

    if (script === SUBSCRIBE_SCRIPT) {
      const [topicKey, connKey, _topicsSetKey] = keys as [string, string, string];
      const [connectionId, topic] = argv as [string, string];
      let topicSet = topicSets.get(topicKey);
      if (!topicSet) {
        topicSet = new Set();
        topicSets.set(topicKey, topicSet);
      }
      const added = topicSet.has(connectionId) ? 0 : 1;
      topicSet.add(connectionId);

      let connSet = connSets.get(connKey);
      if (!connSet) {
        connSet = new Set();
        connSets.set(connKey, connSet);
      }
      connSet.add(topic);
      topicsSet.add(topic);
      return Promise.resolve(added);
    }

    if (script === UNSUBSCRIBE_SCRIPT) {
      const [topicKey, connKey, _topicsSetKey] = keys as [string, string, string];
      const [connectionId, topic] = argv as [string, string];
      const topicSet = topicSets.get(topicKey);
      const removed = topicSet?.has(connectionId) ? 1 : 0;
      if (topicSet) {
        topicSet.delete(connectionId);
        if (topicSet.size === 0) topicSets.delete(topicKey);
      }
      if (removed === 1) {
        const connSet = connSets.get(connKey);
        if (connSet) connSet.delete(topic);
        if (!topicSets.get(topicKey)) topicsSet.delete(topic);
      }
      return Promise.resolve(removed);
    }

    if (script === UNSUBSCRIBE_ALL_SCRIPT) {
      const [connKey, _topicsSetKey] = keys as [string, string];
      const [connectionId] = argv as [string];
      const connSet = connSets.get(connKey);
      const topics = connSet ? Array.from(connSet) : [];
      topics.forEach((topic) => {
        const topicKey = `ws:topic:${topic}`;
        const set = topicSets.get(topicKey);
        if (set) {
          set.delete(connectionId);
          if (set.size === 0) {
            topicSets.delete(topicKey);
            topicsSet.delete(topic);
          }
        }
      });
      connSets.delete(connKey);
      return Promise.resolve(topics.length);
    }

    return Promise.resolve(0);
  }

  function sMembers(key: string): Promise<string[]> {
    if (key === 'ws:topics') return Promise.resolve(Array.from(topicsSet));
    const set = topicSets.get(key) ?? connSets.get(key);
    return Promise.resolve(set ? Array.from(set) : []);
  }

  function sIsMember(key: string, member: string): Promise<boolean> {
    const set = topicSets.get(key) ?? connSets.get(key) ?? topicsSet;
    return Promise.resolve(set instanceof Set ? set.has(member) : false);
  }

  function sCard(key: string): Promise<number> {
    if (key === 'ws:topics') return Promise.resolve(topicsSet.size);
    const set = topicSets.get(key) ?? connSets.get(key);
    return Promise.resolve(set?.size ?? 0);
  }

  return {
    sendCommand,
    sMembers,
    sIsMember,
    sCard,
  } as unknown as RedisClientType & { sendCommand(args: unknown[]): Promise<unknown> };
}

describe('TopicManager', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let manager: TopicManager;
  let mockSockets: WebSocket[];

  beforeEach(() => {
    redis = createMockRedis();
    manager = new TopicManager(redis);
    mockSockets = [
      { id: 'conn-1', readyState: 1, send: jest.fn() } as unknown as WebSocket,
      { id: 'conn-2', readyState: 1, send: jest.fn() } as unknown as WebSocket,
    ];
  });

  describe('subscribe', () => {
    it('returns true when client newly subscribes to a topic', async () => {
      const actualResult = await manager.subscribe(mockSockets[0]!, 'news');
      const expectedResult = true;
      expect(actualResult).toEqual(expectedResult);
    });

    it('returns false when socket has no id', async () => {
      const socketNoId = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const actualResult = await manager.subscribe(socketNoId, 'news');
      expect(actualResult).toBe(false);
    });

    it('returns false when client is already subscribed to the topic', async () => {
      await manager.subscribe(mockSockets[0]!, 'news');
      const actualResult = await manager.subscribe(mockSockets[0]!, 'news');
      const expectedResult = false;
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('unsubscribe', () => {
    it('returns true when client was subscribed and is removed', async () => {
      await manager.subscribe(mockSockets[0]!, 'sport');
      const actualResult = await manager.unsubscribe(mockSockets[0]!, 'sport');
      const expectedResult = true;
      expect(actualResult).toEqual(expectedResult);
    });

    it('returns false when client was not subscribed', async () => {
      const actualResult = await manager.unsubscribe(mockSockets[0]!, 'sport');
      const expectedResult = false;
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('unsubscribeAll', () => {
    it('removes client from all topics and from local maps', async () => {
      await manager.subscribe(mockSockets[0]!, 'a');
      await manager.subscribe(mockSockets[0]!, 'b');
      await manager.unsubscribeAll(mockSockets[0]!);

      const subscribersA = await manager.getSubscribers('a');
      const subscribersB = await manager.getSubscribers('b');
      const expectedSubscribers = new Set<WebSocket>();

      expect(subscribersA).toEqual(expectedSubscribers);
      expect(subscribersB).toEqual(expectedSubscribers);
    });
  });

  describe('getSubscribers', () => {
    it('returns only local WebSockets subscribed to the topic', async () => {
      await manager.subscribe(mockSockets[0]!, 'chat');
      await manager.subscribe(mockSockets[1]!, 'chat');

      const actualResult = await manager.getSubscribers('chat');
      const expectedResult = new Set<WebSocket>([mockSockets[0]!, mockSockets[1]!]);

      expect(actualResult).toEqual(expectedResult);
    });

    it('returns empty set when topic has no subscribers on this node', async () => {
      const actualResult = await manager.getSubscribers('empty');
      const expectedResult = new Set<WebSocket>();
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('getClientTopics', () => {
    it('returns set of topics the client is subscribed to', async () => {
      await manager.subscribe(mockSockets[0]!, 't1');
      await manager.subscribe(mockSockets[0]!, 't2');

      const actualResult = await manager.getClientTopics(mockSockets[0]!);
      const expectedResult = new Set<string>(['t1', 't2']);
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('isSubscribed', () => {
    it('returns true when client is subscribed to topic', async () => {
      await manager.subscribe(mockSockets[0]!, 'x');
      const actualResult = await manager.isSubscribed(mockSockets[0]!, 'x');
      expect(actualResult).toBe(true);
    });

    it('returns false when client is not subscribed', async () => {
      const actualResult = await manager.isSubscribed(mockSockets[0]!, 'x');
      expect(actualResult).toBe(false);
    });
  });

  describe('getTopicCount', () => {
    it('returns number of distinct topics', async () => {
      await manager.subscribe(mockSockets[0]!, 'a');
      await manager.subscribe(mockSockets[1]!, 'b');
      const actualResult = await manager.getTopicCount();
      expect(actualResult).toBe(2);
    });
  });

  describe('getSubscriberCount', () => {
    it('returns number of subscribers for the topic', async () => {
      await manager.subscribe(mockSockets[0]!, 'z');
      await manager.subscribe(mockSockets[1]!, 'z');
      const actualResult = await manager.getSubscriberCount('z');
      expect(actualResult).toBe(2);
    });
  });
});
