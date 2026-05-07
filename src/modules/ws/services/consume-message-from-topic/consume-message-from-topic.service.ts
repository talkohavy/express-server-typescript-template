import { WebSocket } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { WS_TOPIC_PUBSUB_CHANNEL } from '@src/lib/websocket-manager';
import type { TopicMessageInterceptor } from './types';
import type { LoggerService } from '@src/lib/logger-service';
import type { TopicMessage, WebsocketManager } from '@src/lib/websocket-manager';
import type { RedisClientType } from 'redis';

/**
 * Subscribes to the Redis topic pub/sub channel and forwards incoming messages
 * to the local WebSocket clients subscribed to each topic.
 *
 * Registered interceptors run between receiving the Redis message and sending
 * to each socket, allowing per-socket data modification or filtering.
 */
export class ConsumeMessageFromTopicService {
  private readonly interceptors: TopicMessageInterceptor[] = [];

  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
    private readonly redisSub: RedisClientType,
  ) {}

  /**
   * Start listening on the Redis pub/sub channel. Call once on startup.
   */
  async subscribeToPubSub(): Promise<void> {
    await this.redisSub.subscribe(WS_TOPIC_PUBSUB_CHANNEL, this.onTopicMessage.bind(this));
  }

  private async onTopicMessage(payloadAsString: string): Promise<void> {
    const parsedPayload = parseJson<TopicMessage>(payloadAsString);

    if (!parsedPayload) {
      console.error('WS topic pub/sub: invalid JSON received on channel', WS_TOPIC_PUBSUB_CHANNEL);
      return;
    }

    const { topic, data } = parsedPayload;

    if (typeof data !== 'object' || data === null) {
      this.logger.error('WS topic pub/sub: invalid data received on channel', WS_TOPIC_PUBSUB_CHANNEL);
      return;
    }

    const topicSubscribers = await this.wsManager.getTopicSubscribers(topic);

    topicSubscribers.forEach((socket) => {
      if (socket.readyState !== WebSocket.OPEN) return;

      const dataToSend = this.applyInterceptors({ topic, data, socket });

      if (dataToSend === null) return;

      try {
        const serialized = JSON.stringify(dataToSend);
        socket.send(serialized, { binary: false });
      } catch (error) {
        console.error(`Failed to send topic message to client in topic "${topic}":`, error);
      }
    });
  }

  /**
   * Register an interceptor that runs before each socket send.
   * Interceptors are applied in registration order; returning `null` drops the message for that socket.
   */
  registerInterceptor(interceptor: TopicMessageInterceptor): void {
    this.interceptors.push(interceptor);
  }

  async cleanup(): Promise<void> {
    await this.redisSub.unsubscribe(WS_TOPIC_PUBSUB_CHANNEL);
  }

  /**
   * Runs the interceptor chain for a single socket.
   * Each interceptor receives the (potentially modified) output of the previous one.
   * Returns `null` if any interceptor drops the message for this socket.
   */
  private applyInterceptors(props: {
    topic: string;
    data: Record<string, unknown>;
    socket: WebSocket;
  }): Record<string, unknown> | null {
    const { topic, data, socket } = props;

    const result = this.interceptors.reduce<Record<string, unknown> | null>((acc, interceptor) => {
      if (acc === null) return null;

      return interceptor({ topic, data: acc, socket });
    }, data);

    return result;
  }
}
