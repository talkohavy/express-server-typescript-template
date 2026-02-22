import { ActionsEventHandler } from './event-handlers/actions';
import { CloseEventHandler } from './event-handlers/close';
import { ErrorEventHandler } from './event-handlers/error';
import { MessageDispatcherEventHandler } from './event-handlers/message-dispatcher';
import { PingPongEventHandler } from './event-handlers/ping-pong';
import { StaticTopics } from './logic/constants';
import { WsMiddleware } from './middlewares/ws.middleware';
import { TopicRegistrationActions } from './services/actions';
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
  topicRegistrationActions!: TopicRegistrationActions;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsManager, logger } = this.app;

    this.topicRegistrationActions = new TopicRegistrationActions(wsManager, logger);

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    const { wsApp, wsManager, logger } = this.app;

    const pingPongEventHandler = new PingPongEventHandler(wsApp);
    const errorEventHandler = new ErrorEventHandler(wsApp, logger);
    const closeEventHandler = new CloseEventHandler(wsApp, wsManager, logger);

    const actionsEventHandler = new ActionsEventHandler(logger, {
      ...this.topicRegistrationActions.getActionHandlers(),
    });

    const messageDispatcher = new MessageDispatcherEventHandler(
      wsApp,
      {
        [StaticTopics.Actions]: actionsEventHandler.handleEvent.bind(actionsEventHandler),
      },
      logger,
    );

    const wsMiddleware = new WsMiddleware(wsApp);

    wsMiddleware.use();
    pingPongEventHandler.registerEventHandlers();
    errorEventHandler.registerEventHandlers();
    closeEventHandler.registerEventHandlers();
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
