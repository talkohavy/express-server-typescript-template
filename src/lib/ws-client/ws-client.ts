import { WebSocket, WebSocketServer } from 'ws';
import { BUILT_IN_WEBSOCKET_EVENTS } from './logic/constants';
import { TopicManager } from './logic/topic-manager';
import type { TopicMessage } from './types';
import type {
  BroadcastToAllButSelfProps,
  BroadcastToAllProps,
  PublishToTopicProps,
  WebsocketClientConfig,
  WebSocketServerOptions,
} from './ws-client.interface';
import type { RedisClientType } from 'redis';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

export class WebsocketClient {
  readonly wss: WebSocketServer;
  private readonly heartbeatIntervalMs: number;
  private readonly isAliveBySocket = new WeakMap<WebSocket, boolean>();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly topicManager: TopicManager;

  constructor(
    options: WebSocketServerOptions,
    customConfig: WebsocketClientConfig,
    private readonly redis: RedisClientType,
  ) {
    this.wss = new WebSocketServer(options);
    this.topicManager = new TopicManager(this.redis);

    const { heartbeat: heartbeatConfig } = customConfig ?? {};
    const { intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS } = heartbeatConfig ?? {};

    this.heartbeatIntervalMs = intervalMs > 0 ? intervalMs : 0;

    const isHeartbeatEnabled = this.heartbeatIntervalMs > 0;

    if (isHeartbeatEnabled) this.addHeartbeatMechanism();
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
    return this.topicManager.unsubscribeAll(client);
  }

  async publishToTopic(props: PublishToTopicProps): Promise<number> {
    const { topic, payload, options } = props;
    const { binary: isBinary = false } = options ?? {};

    const topicSubscribers = await this.topicManager.getSubscribers(topic);

    if (topicSubscribers.size === 0) return 0;

    const messageRaw: TopicMessage = { topic, payload, timestamp: Date.now() };
    const messageStringified = JSON.stringify(messageRaw);

    let sentCount = 0;

    topicSubscribers.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      try {
        client.send(messageStringified, { binary: isBinary });
        sentCount++;
      } catch (error) {
        // Log error but continue sending to other clients. The client will be cleaned up on next disconnect check.
        console.error(`Failed to send message to client in topic "${topic}":`, error);
      }
    });

    return sentCount;
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
}
