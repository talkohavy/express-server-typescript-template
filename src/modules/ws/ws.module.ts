import { StaticTopics } from './logic/constants';
import { AttachCloseHandlerToSocketMiddleware } from './middleware/attach-close-handler-to-socket.middleware';
import { AttachErrorHandlerToSocketMiddleware } from './middleware/attach-error-handler-to-socket.middleware';
import { AttachMessageHandlerToSocketMiddleware } from './middleware/attach-message-handler-to-socket.middleware';
import { AttachPongHandlerToSocketMiddleware } from './middleware/attach-pong-handler-to-socket.middleware';
import { AttachSocketIdToConnectionMiddleware } from './middleware/attach-socket-id-to-connection.middleware';
import { SubscribeSocketToRootTopicMiddleware } from './middleware/subscribe-socket-to-root-topic.middleware';
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
 * - Producers call `app.wsManager.publishToTopic({ topic, payload })` (e.g. from routes, jobs, or the sample below).
 * - Messages are published to Redis channel "ws:topic:pubsub".
 * - Each node receives them in WebsocketManager (subscribeToPubSubTopicsChannel) and forwards to its local clients
 *   subscribed to that topic. See WebsocketManager for the receive/forward implementation.
 */
export class WsModule {
  pingPongService: PingPongService;
  topicRegistrationService: TopicRegistrationService;
  publishMessageToTopicService: PublishMessageToTopicService;
  webRtcSignalingService: WebRtcSignalingService;
  messageDispatcherByEventService: MessageDispatcherByEventService;

  constructor(private readonly app: Application) {
    const { wsManager, logger } = this.app;

    this.pingPongService = new PingPongService();
    this.topicRegistrationService = new TopicRegistrationService(wsManager, logger);
    this.publishMessageToTopicService = new PublishMessageToTopicService(wsManager, logger);
    this.webRtcSignalingService = new WebRtcSignalingService(wsManager, logger);
    this.messageDispatcherByEventService = new MessageDispatcherByEventService(
      {
        ...this.topicRegistrationService.getActionHandlers(),
        ...this.publishMessageToTopicService.getActionHandlers(),
        ...this.webRtcSignalingService.getActionHandlers(),
      },
      logger,
    );

    this.registerEventHandlers();
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

    wsConnectionPipelineService.register([
      attachSocketIdToConnectionMiddleware,
      subscribeSocketToRootTopicMiddleware,
      attachCloseHandlerToSocketMiddleware,
      attachErrorHandlerToSocketMiddleware,
      attachPongToSocketMiddleware,
      attachMessageHandlerToSocketMiddleware,
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
