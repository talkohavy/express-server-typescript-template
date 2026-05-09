import { WebSocket } from 'ws';
import { parseJson } from '@src/common/utils/parseJson';
import { WS_TOPIC_PUBSUB_CHANNEL } from '@src/lib/websocket-manager';
import type { InterceptorFunc } from './types';
import type { LoggerService } from '@src/lib/logger-service';
import type { TopicPayload, WebsocketManager } from '@src/lib/websocket-manager';
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

  /**
   * `onTopicMessage` is the last step in the Rocket-Staging analogy.
   * We do here a stage separation, where we shed the topic from the payload (TopicPayload),
   * and send just the data to the appropriate clients.
   */
  private async onTopicMessage(payloadAsString: string): Promise<void> {
    const parsedPayload = parseJson<TopicPayload>(payloadAsString);

    if (!this.getIsValidTopicMessage(parsedPayload)) {
      this.logger.error('WS topic pub/sub: invalid JSON/data received on channel', WS_TOPIC_PUBSUB_CHANNEL);

      return;
    }

    const { topic, data } = parsedPayload;

    const topicSubscribers = await this.wsManager.getTopicSubscribers(topic);

    for (const socket of topicSubscribers) {
      if (socket.readyState !== WebSocket.OPEN) continue;

      const interceptor = this.topicInterceptors[topic];

      const dataToSend = interceptor ? await interceptor(parsedPayload) : data;

      if (dataToSend === null) continue;

      try {
        const serialized = JSON.stringify(dataToSend);
        socket.send(serialized, { binary: false });
      } catch (error) {
        console.error(`Failed to send topic message to client in topic "${topic}":`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.redisSub.unsubscribe(WS_TOPIC_PUBSUB_CHANNEL);
  }

  private getIsValidTopicMessage(topicPayload: TopicPayload | null): topicPayload is TopicPayload {
    if (!topicPayload) return false;

    const { data } = topicPayload;

    return typeof data === 'object' && data !== null;
  }
}
