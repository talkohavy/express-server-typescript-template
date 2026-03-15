import { MessageDispatcherByEventHandler } from './event-handlers/message-dispatcher-by-event.event-handler';
import { PingPongEventHandler } from './event-handlers/ping-pong.event-handler';
import { StaticTopics } from './logic/constants';
import { AttachCloseHandlerToSocketMiddleware } from './middlewares/attach-close-handler-to-socket.middleware';
import { AttachErrorHandlerToSocketMiddleware } from './middlewares/attach-error-handler-to-socket.middleware';
import { AttachSocketIdToConnectionMiddleware } from './middlewares/attach-socket-id-to-connection.middleware';
import { SubscribeSocketToRootTopicMiddleware } from './middlewares/subscribe-socket-to-root-topic.middleware';
import { PublishMessageToTopicService, TopicRegistrationService, WebRtcSignalingService } from './services';
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

    // middlewares:
    const attachSocketIdToConnectionMiddleware = new AttachSocketIdToConnectionMiddleware(wsApp);
    const subscribeSocketToRootTopicMiddleware = new SubscribeSocketToRootTopicMiddleware(wsApp, wsManager, logger);
    const attachCloseHandlerToSocketMiddleware = new AttachCloseHandlerToSocketMiddleware(wsApp, wsManager, logger);
    const attachErrorHandlerToSocketMiddleware = new AttachErrorHandlerToSocketMiddleware(wsApp, logger);

    attachSocketIdToConnectionMiddleware.use();
    subscribeSocketToRootTopicMiddleware.use();
    attachCloseHandlerToSocketMiddleware.use();
    attachErrorHandlerToSocketMiddleware.use();

    // event handlers:
    const pingPongEventHandler = new PingPongEventHandler(wsApp);
    const messageDispatcherByEventHandler = new MessageDispatcherByEventHandler(
      wsApp,
      {
        ...this.topicRegistrationService.getActionHandlers(),
        ...this.publishMessageToTopicService.getActionHandlers(),
        ...this.webRtcSignalingService.getActionHandlers(),
      },
      logger,
    );

    pingPongEventHandler.registerEventHandlers();
    messageDispatcherByEventHandler.registerEventHandlers();

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
