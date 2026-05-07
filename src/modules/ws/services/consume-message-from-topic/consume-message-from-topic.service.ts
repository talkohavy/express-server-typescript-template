import { WebSocket } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { WS_TOPIC_PUBSUB_CHANNEL } from '@src/lib/websocket-manager';
import type { LoggerService } from '@src/lib/logger-service';
import type { TopicMessage, WebsocketManager } from '@src/lib/websocket-manager';
import type { RedisClientType } from 'redis';

export class ConsumeMessageFromTopicService {
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

      try {
        const serialized = JSON.stringify(parsedPayload);
        socket.send(serialized, { binary: false });
      } catch (error) {
        console.error(`Failed to send topic message to client in topic "${topic}":`, error);
      }
    });
  }

  async cleanup(): Promise<void> {
    await this.redisSub.unsubscribe(WS_TOPIC_PUBSUB_CHANNEL);
  }
}
