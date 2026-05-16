import { PublishToTopicController } from './controllers/publish-to-topic';
import { TopicRegistrationController } from './controllers/topic-registration';
import { WebRtcSignalingController } from './controllers/webrtc-signaling';
import { StaticTopics } from './logic/constants';
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
import type { TopicPayload } from '@src/common/types';
import type { ModuleFactory } from '@src/lib/lucky-server';
import type { TopicPublisherService } from '../../lib/topic-publisher';

/**
 * WebSocket module: connection lifecycle, message dispatch, and topic pub/sub.
 *
 * **Sending messages to clients (by topic):**
 * - Producers call `app.topicPublisherService.publishToTopic({ topic, data })` (e.g. from routes, jobs, or the sample below).
 * - Messages are published to Redis channel "ws:topic:pubsub".
 * - Each node receives them in TopicSubscriberService and forwards to its local clients subscribed to that topic.
 *
 * **Architecture:**
 * - TopicPublisherService: Publishes messages to Redis pub/sub
 * - TopicSubscriberService: Manages subscriptions, listens to pub/sub, and forwards to local WebSocket clients
 */
export class WsModule implements ModuleFactory {
  private messageDispatcherByEventService!: MessageDispatcherByEventService;
  // private topicSubscriberService!: TopicSubscriberService;
  private topicPublisherService!: TopicPublisherService;
  private pingPongService!: PingPongService;

  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    const { logger, topicSubscriber } = this.app;

    // Services
    this.pingPongService = new PingPongService();

    // const dataInterceptorService = new DataInterceptorService();

    // this.topicSubscriberService = new TopicSubscriberService(redis.pub, redis.sub, logger, {
    //   ...dataInterceptorService.getInterceptors(),
    // });

    await topicSubscriber.subscribeToPubSub();

    this.messageDispatcherByEventService = new MessageDispatcherByEventService(logger);

    // Controllers
    this.attachControllers();

    // Connection pipeline
    this.attachConnectionPipeline();
  }

  private attachControllers(): void {
    const { logger, topicPublisher, topicSubscriber } = this.app;

    const publishToTopicController = new PublishToTopicController(
      topicPublisher,
      this.messageDispatcherByEventService,
      logger,
    );

    const topicRegistrationController = new TopicRegistrationController(
      topicSubscriber,
      this.messageDispatcherByEventService,
      logger,
    );

    const webRtcSignalingController = new WebRtcSignalingController(
      topicPublisher,
      topicSubscriber,
      this.messageDispatcherByEventService,
      logger,
    );

    publishToTopicController.attachEventHandlers();
    topicRegistrationController.attachEventHandlers();
    webRtcSignalingController.attachEventHandlers();
  }

  private attachConnectionPipeline(): void {
    const { wsApp, logger, topicSubscriber } = this.app;

    const wsConnectionPipelineService = new WsConnectionPipelineService(wsApp);

    wsConnectionPipelineService.register([
      new AttachSocketIdToConnectionPipeline(),
      new SubscribeSocketToRootTopicPipeline(topicSubscriber, logger),
      new AttachCloseHandlerToSocketPipeline(topicSubscriber, logger),
      new AttachErrorHandlerToSocketPipeline(logger),
      new AttachPongHandlerToSocketPipeline(this.pingPongService),
      new AttachMessageHandlerToSocketPipeline(this.messageDispatcherByEventService),
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

        this.topicPublisherService.publishToTopic(payload);
      }, 4000);
    }
  }

  get services() {
    return {
      messageDispatcherByEventService: this.messageDispatcherByEventService,
      pingPongService: this.pingPongService,
    };
  }
}
