import { MessageDispatcherByEventHandler } from './event-handlers/message-dispatcher-by-event.event-handler';
import { PingPongEventHandler } from './event-handlers/ping-pong.event-handler';
import { StaticTopics } from './logic/constants';
import { AttachCloseHandlerToSocketMiddleware } from './middleware/attach-close-handler-to-socket.middleware';
import { AttachErrorHandlerToSocketMiddleware } from './middleware/attach-error-handler-to-socket.middleware';
import { AttachSocketIdToConnectionMiddleware } from './middleware/attach-socket-id-to-connection.middleware';
import { SubscribeSocketToRootTopicMiddleware } from './middleware/subscribe-socket-to-root-topic.middleware';
import { PublishMessageToTopicService, TopicRegistrationService, WebRtcSignalingService } from './services';
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
  topicRegistrationService!: TopicRegistrationService;
  publishMessageToTopicService!: PublishMessageToTopicService;
  webRtcSignalingService!: WebRtcSignalingService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsManager, logger } = this.app;

    this.topicRegistrationService = new TopicRegistrationService(wsManager, logger);
    this.publishMessageToTopicService = new PublishMessageToTopicService(wsManager, logger);
    this.webRtcSignalingService = new WebRtcSignalingService(wsManager, logger);

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    const { wsApp, wsManager, logger } = this.app;

    const wsConnectionPipelineService = new WsConnectionPipelineService(wsApp);

    const attachSocketIdToConnectionMiddleware = new AttachSocketIdToConnectionMiddleware();
    const subscribeSocketToRootTopicMiddleware = new SubscribeSocketToRootTopicMiddleware(wsManager, logger);
    const attachCloseHandlerToSocketMiddleware = new AttachCloseHandlerToSocketMiddleware(wsManager, logger);
    const attachErrorHandlerToSocketMiddleware = new AttachErrorHandlerToSocketMiddleware(logger);
    const pingPongEventHandler = new PingPongEventHandler();
    const messageDispatcherByEventHandler = new MessageDispatcherByEventHandler(
      {
        ...this.topicRegistrationService.getActionHandlers(),
        ...this.publishMessageToTopicService.getActionHandlers(),
        ...this.webRtcSignalingService.getActionHandlers(),
      },
      logger,
    );

    wsConnectionPipelineService.register([
      attachSocketIdToConnectionMiddleware,
      subscribeSocketToRootTopicMiddleware,
      attachCloseHandlerToSocketMiddleware,
      attachErrorHandlerToSocketMiddleware,
      pingPongEventHandler,
      messageDispatcherByEventHandler,
    ]);

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
