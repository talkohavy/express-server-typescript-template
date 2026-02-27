import { CloseEventHandler } from './event-handlers/close';
import { ConnectionPresenceEventHandler } from './event-handlers/connection-presence';
import { ErrorEventHandler } from './event-handlers/error';
import { MessageDispatcherEventHandler } from './event-handlers/message-dispatcher';
import { PingPongEventHandler } from './event-handlers/ping-pong';
import { StaticTopics } from './logic/constants';
import { WsMiddleware } from './middlewares/ws.middleware';
import { SendMessageService, TopicRegistrationService, WebRtcSignalingService } from './services';
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
  sendMessageService!: SendMessageService;
  webRtcSignalingService!: WebRtcSignalingService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsManager, logger } = this.app;

    this.topicRegistrationService = new TopicRegistrationService(wsManager, logger);
    this.sendMessageService = new SendMessageService(wsManager, logger);
    this.webRtcSignalingService = new WebRtcSignalingService(logger);

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    const { wsApp, wsManager, logger } = this.app;

    const pingPongEventHandler = new PingPongEventHandler(wsApp);
    const errorEventHandler = new ErrorEventHandler(wsApp, logger);
    const closeEventHandler = new CloseEventHandler(wsApp, wsManager, logger);
    const connectionPresenceEventHandler = new ConnectionPresenceEventHandler(wsApp, wsManager, logger);
    const messageDispatcher = new MessageDispatcherEventHandler(
      wsApp,
      {
        ...this.topicRegistrationService.getActionHandlers(),
        ...this.sendMessageService.getActionHandlers(),
        ...this.webRtcSignalingService.getActionHandlers(),
      },
      logger,
    );

    const wsMiddleware = new WsMiddleware(wsApp);

    wsMiddleware.use();
    pingPongEventHandler.registerEventHandlers();
    errorEventHandler.registerEventHandlers();
    closeEventHandler.registerEventHandlers();
    connectionPresenceEventHandler.registerEventHandlers();
    messageDispatcher.registerEventHandlers();

    if (process.env.PUB_SUB_ENABLED) {
      setInterval(() => {
        const eventData: TopicMessage = {
          topic: StaticTopics.Data,
          payload: { message: 'Hello, world!' },
          timestamp: Date.now(),
        };

        this.app.wsManager.publishToTopic(eventData);
      }, 4000);
    }
  }
}
