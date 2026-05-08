import { WS_TOPIC_PUBSUB_CHANNEL, type TopicMessage } from '@src/lib/websocket-manager';
import { PublishToTopicController } from './controllers/publish-to-topic';
import { TopicRegistrationController } from './controllers/topic-registration';
import { WebRtcSignalingController } from './controllers/webrtc-signaling';
import { StaticTopics } from './logic/constants';
import { AttachCloseHandlerToSocketMiddleware } from './middleware/attach-close-handler-to-socket.middleware';
import { AttachErrorHandlerToSocketMiddleware } from './middleware/attach-error-handler-to-socket.middleware';
import { AttachMessageHandlerToSocketMiddleware } from './middleware/attach-message-handler-to-socket.middleware';
import { AttachPongHandlerToSocketMiddleware } from './middleware/attach-pong-handler-to-socket.middleware';
import { AttachSocketIdToConnectionMiddleware } from './middleware/attach-socket-id-to-connection.middleware';
import { ConnectionAcknowledgeMiddleware } from './middleware/connection-acknowledge.middleware';
import { SubscribeSocketToRootTopicMiddleware } from './middleware/subscribe-socket-to-root-topic.middleware';
import { ConsumeMessageFromTopicService } from './services/consume-message-from-topic';
import { DataInterceptorService } from './services/consume-message-interceptors/data.interceptor.service';
import { MessageDispatcherByEventService } from './services/message-dispatcher-by-event';
import { PingPongService } from './services/ping-pong';
import { WsConnectionPipelineService } from './services/ws-connection-pipeline';
import type { ModuleFactory } from '@src/lib/lucky-server';
import type { Application } from 'express';

/**
 * WebSocket module: connection lifecycle, message dispatch, and topic pub/sub.
 *
 * **Sending messages to clients (by topic):**
 * - Producers call `app.wsManager.publishToTopic({ topic, data })` (e.g. from routes, jobs, or the sample below).
 * - Messages are published to Redis channel "ws:topic:pubsub".
 * - Each node receives them in ConsumeMessageFromTopicService and forwards to its local clients subscribed to that topic.
 */
export class WsModule implements ModuleFactory {
  private messageDispatcherService!: MessageDispatcherByEventService;
  private consumeMessageFromTopicService!: ConsumeMessageFromTopicService;
  private pingPongService!: PingPongService;

  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    const { wsManager, logger, redis } = this.app;

    // Services
    this.pingPongService = new PingPongService();
    this.messageDispatcherService = new MessageDispatcherByEventService(logger);

    const dataInterceptorService = new DataInterceptorService();

    this.consumeMessageFromTopicService = new ConsumeMessageFromTopicService(wsManager, logger, redis.sub, {
      ...dataInterceptorService.getInterceptors(),
    });

    await this.consumeMessageFromTopicService.subscribeToPubSub(WS_TOPIC_PUBSUB_CHANNEL);

    // Controllers
    this.attachControllers();

    // Connection pipeline
    this.attachConnectionPipeline();
  }

  private attachControllers(): void {
    const { wsManager, logger } = this.app;

    const publishToTopicController = new PublishToTopicController(wsManager, logger, this.messageDispatcherService);
    const topicRegistrationController = new TopicRegistrationController(
      wsManager,
      logger,
      this.messageDispatcherService,
    );
    const webRtcSignalingController = new WebRtcSignalingController(wsManager, logger, this.messageDispatcherService);

    publishToTopicController.attachEventHandlers();
    topicRegistrationController.attachEventHandlers();
    webRtcSignalingController.attachEventHandlers();
  }

  private attachConnectionPipeline(): void {
    const { wsApp, wsManager, logger } = this.app;

    const wsConnectionPipelineService = new WsConnectionPipelineService(wsApp);

    wsConnectionPipelineService.register([
      new AttachSocketIdToConnectionMiddleware(),
      new SubscribeSocketToRootTopicMiddleware(wsManager, logger),
      new AttachCloseHandlerToSocketMiddleware(wsManager, logger),
      new AttachErrorHandlerToSocketMiddleware(logger),
      new AttachPongHandlerToSocketMiddleware(this.pingPongService),
      new AttachMessageHandlerToSocketMiddleware(this.messageDispatcherService),
      new ConnectionAcknowledgeMiddleware(),
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

  get services() {
    return {
      messageDispatcherService: this.messageDispatcherService,
      consumeMessageFromTopicService: this.consumeMessageFromTopicService,
      pingPongService: this.pingPongService,
    };
  }
}
