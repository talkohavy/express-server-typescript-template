import { ActionsEventHandler } from './event-handlers/actions';
import { CloseEventHandler } from './event-handlers/close';
import { ErrorEventHandler } from './event-handlers/error';
import { HeartbeatEventHandler } from './event-handlers/heartbeat';
import { StaticTopics } from './logic/constants';
import { WsMiddleware } from './middlewares/ws.middleware';
import { TopicRegistrationActions } from './services/actions';
import type { TopicMessage } from '@src/lib/websocket-manager';
import type { Application } from 'express';

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

    const heartbeatEventHandler = new HeartbeatEventHandler(wsApp);
    const errorEventHandler = new ErrorEventHandler(wsApp, logger);
    const closeEventHandler = new CloseEventHandler(wsApp, wsManager, logger);

    const actionsEventHandler = new ActionsEventHandler(wsApp, logger, {
      ...this.topicRegistrationActions.getActionHandlers(),
    });

    const wsMiddleware = new WsMiddleware();

    wsMiddleware.use();
    heartbeatEventHandler.registerEventHandlers();
    errorEventHandler.registerEventHandlers();
    closeEventHandler.registerEventHandlers();
    actionsEventHandler.registerEventHandlers();

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
