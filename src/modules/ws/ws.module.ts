import { StaticTopics } from './logic/constants';
import { AttachCloseHandlerToSocketMiddleware } from './middleware/attach-close-handler-to-socket.middleware';
import { AttachErrorHandlerToSocketMiddleware } from './middleware/attach-error-handler-to-socket.middleware';
import { AttachMessageHandlerToSocketMiddleware } from './middleware/attach-message-handler-to-socket.middleware';
import { AttachPongHandlerToSocketMiddleware } from './middleware/attach-pong-handler-to-socket.middleware';
import { AttachSocketIdToConnectionMiddleware } from './middleware/attach-socket-id-to-connection.middleware';
import { ConnectionAcknowledgeMiddleware } from './middleware/connection-acknowledge.middleware';
import { SubscribeSocketToRootTopicMiddleware } from './middleware/subscribe-socket-to-root-topic.middleware';
import { ConsumeMessageFromTopicService } from './services/consume-message-from-topic';
import { MessageDispatcherByEventService } from './services/message-dispatcher-by-event';
import { PingPongService } from './services/ping-pong';
import { PublishMessageToTopicService } from './services/publish-message-to-topic';
import { TopicRegistrationService } from './services/topic-registration';
import { WebRtcSignalingService } from './services/webrtc-signaling';
import { WsConnectionPipelineService } from './services/ws-connection-pipeline';
import type { TopicMessage } from '@src/lib/websocket-manager';
import type { Application } from 'express';

/**
 * WebSocket module: connection lifecycle, message dispatch, and topic pub/sub.
 *
 * **Sending messages to clients (by topic):**
 * - Producers call `app.wsManager.publishToTopic({ topic, data })` (e.g. from routes, jobs, or the sample below).
 * - Messages are published to Redis channel "ws:topic:pubsub".
 * - Each node receives them in ConsumeMessageFromTopicService and forwards to its local clients subscribed to that topic.
 * - Interceptors can be registered on `consumeMessageFromTopicService` to modify or filter messages per-socket.
 */
export class WsModule {
  pingPongService: PingPongService;
  topicRegistrationService: TopicRegistrationService;
  publishMessageToTopicService: PublishMessageToTopicService;
  consumeMessageFromTopicService: ConsumeMessageFromTopicService;
  webRtcSignalingService: WebRtcSignalingService;
  messageDispatcherByEventService: MessageDispatcherByEventService;

  constructor(private readonly app: Application) {
    const { wsManager, logger, redis } = this.app;

    this.pingPongService = new PingPongService();
    this.topicRegistrationService = new TopicRegistrationService(wsManager, logger);
    this.publishMessageToTopicService = new PublishMessageToTopicService(wsManager, logger);
    this.consumeMessageFromTopicService = new ConsumeMessageFromTopicService(wsManager, logger, redis.sub);
    this.webRtcSignalingService = new WebRtcSignalingService(wsManager, logger);
    this.messageDispatcherByEventService = new MessageDispatcherByEventService(
      {
        ...this.topicRegistrationService.getActionHandlers(),
        ...this.publishMessageToTopicService.getActionHandlers(),
        ...this.webRtcSignalingService.getActionHandlers(),
      },
      logger,
    );

    this.consumeMessageFromTopicService.listen();
    this.registerEventHandlers();
  }

  async cleanup(): Promise<void> {
    await this.consumeMessageFromTopicService.cleanup();
  }

  private registerEventHandlers(): void {
    const { wsApp, wsManager, logger } = this.app;

    const wsConnectionPipelineService = new WsConnectionPipelineService(wsApp);

    const attachSocketIdToConnectionMiddleware = new AttachSocketIdToConnectionMiddleware();
    const subscribeSocketToRootTopicMiddleware = new SubscribeSocketToRootTopicMiddleware(wsManager, logger);
    const attachCloseHandlerToSocketMiddleware = new AttachCloseHandlerToSocketMiddleware(wsManager, logger);
    const attachErrorHandlerToSocketMiddleware = new AttachErrorHandlerToSocketMiddleware(logger);
    const attachPongToSocketMiddleware = new AttachPongHandlerToSocketMiddleware(this.pingPongService);
    const attachMessageHandlerToSocketMiddleware = new AttachMessageHandlerToSocketMiddleware(
      this.messageDispatcherByEventService,
    );
    const connectionAcknowledgeMiddleware = new ConnectionAcknowledgeMiddleware();

    wsConnectionPipelineService.register([
      attachSocketIdToConnectionMiddleware,
      subscribeSocketToRootTopicMiddleware,
      attachCloseHandlerToSocketMiddleware,
      attachErrorHandlerToSocketMiddleware,
      attachPongToSocketMiddleware,
      attachMessageHandlerToSocketMiddleware,
      connectionAcknowledgeMiddleware,
    ]);

    // ---------------------------------------------

    if (process.env.SIMULATE_STREAMING_TO_TOPIC) {
      setInterval(() => {
        const payload: TopicMessage = {
          topic: StaticTopics.Data,
          data: { message: 'Hello, world!' },
          timestamp: Date.now(),
        };

        this.app.wsManager.publishToTopic(payload);
      }, 4000);
    }
  }
}
