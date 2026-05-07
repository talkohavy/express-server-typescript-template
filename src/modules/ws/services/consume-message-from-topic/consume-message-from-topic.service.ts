import { WebSocket } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { WS_TOPIC_PUBSUB_CHANNEL } from '@src/lib/websocket-manager';
import type { InterceptorFunc } from './types';
import type { LoggerService } from '@src/lib/logger-service';
import type { TopicMessage, WebsocketManager } from '@src/lib/websocket-manager';
import type { RedisClientType } from 'redis';

export class ConsumeMessageFromTopicService {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
    private readonly redisSub: RedisClientType,
    private readonly topicInterceptors: Record<string, InterceptorFunc> = {},
  ) {}

  /**
   * Start listening on the Redis pub/sub channel. Call once on startup.
   */
  async subscribeToPubSub(channelName: string): Promise<void> {
    await this.redisSub.subscribe(channelName, this.onTopicMessage.bind(this));
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

    for (const socket of topicSubscribers) {
      if (socket.readyState !== WebSocket.OPEN) continue;

      const interceptor = this.topicInterceptors[topic];

      const payloadToSend = interceptor ? await interceptor(parsedPayload) : parsedPayload;

      if (payloadToSend === null) continue;

      try {
        const serialized = JSON.stringify(payloadToSend);
        socket.send(serialized, { binary: false });
      } catch (error) {
        console.error(`Failed to send topic message to client in topic "${topic}":`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.redisSub.unsubscribe(WS_TOPIC_PUBSUB_CHANNEL);
  }
}
