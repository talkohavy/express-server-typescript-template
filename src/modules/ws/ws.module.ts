import { WS_TOPIC_PUBSUB_CHANNEL, type TopicPayload } from '@src/lib/websocket-manager';
import { PublishToTopicController } from './controllers/publish-to-topic';
import { TopicRegistrationController } from './controllers/topic-registration';
import { WebRtcSignalingController } from './controllers/webrtc-signaling';
import { StaticTopics } from './logic/constants';
import { ConsumeMessageFromTopicService } from './services/consume-message-from-topic';
import { DataInterceptorService } from './services/consume-message-interceptors/data.interceptor.service';
import { MessageDispatcherByEventService } from './services/message-dispatcher-by-event';
import { PingPongService } from './services/ping-pong';
import { WsConnectionPipelineService } from './services/ws-connection-pipeline';
import { AttachCloseHandlerToSocketPipeline } from './services/ws-connection-pipeline/pipeline/attach-close-handler-to-socket.pipeline';
import { AttachErrorHandlerToSocketPipeline } from './services/ws-connection-pipeline/pipeline/attach-error-handler-to-socket.pipeline';
import { AttachMessageHandlerToSocketPipeline } from './services/ws-connection-pipeline/pipeline/attach-message-handler-to-socket.pipeline';
import { AttachPongHandlerToSocketPipeline } from './services/ws-connection-pipeline/pipeline/attach-pong-handler-to-socket.pipeline';
import { AttachSocketIdToConnectionPipeline } from './services/ws-connection-pipeline/pipeline/attach-socket-id-to-connection.pipeline';
import { ConnectionAcknowledgePipeline } from './services/ws-connection-pipeline/pipeline/connection-acknowledge.pipeline';
import { SubscribeSocketToRootTopicPipeline } from './services/ws-connection-pipeline/pipeline/subscribe-socket-to-root-topic.pipeline';
import type { Application } from 'express';
import type { ModuleFactory } from '@src/lib/lucky-server';

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
      new AttachSocketIdToConnectionPipeline(),
      new SubscribeSocketToRootTopicPipeline(wsManager, logger),
      new AttachCloseHandlerToSocketPipeline(wsManager, logger),
      new AttachErrorHandlerToSocketPipeline(logger),
      new AttachPongHandlerToSocketPipeline(this.pingPongService),
      new AttachMessageHandlerToSocketPipeline(this.messageDispatcherService),
      new ConnectionAcknowledgePipeline(),
    ]);

    // ---------------------------------------------

    if (process.env.SIMULATE_STREAMING_TO_TOPIC) {
      setInterval(() => {
        const payload: TopicPayload = {
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
