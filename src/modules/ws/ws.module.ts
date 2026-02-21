import { ActionsEventHandler } from './event-handlers/actions';
import { ConnectionEventHandler } from './event-handlers/connection';
import { StaticTopics } from './logic/constants';
import { TopicRegistrationActions } from './services/actions';
import type { TopicMessage } from '@src/lib/websocket-manager';
import type { Application } from 'express';

export class WsModule {
  private connectionEventHandler!: ConnectionEventHandler;
  private actionsEventHandler!: ActionsEventHandler;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsApp, wsManager, logger } = this.app;

    this.connectionEventHandler = new ConnectionEventHandler(wsApp, wsManager, logger);

    const topicRegistrationActions = new TopicRegistrationActions(wsManager, logger);
    this.actionsEventHandler = new ActionsEventHandler(wsApp, logger, {
      ...topicRegistrationActions.getActionHandlers(),
    });

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.connectionEventHandler.registerEventHandlers();
    this.actionsEventHandler.registerEventHandlers();

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
