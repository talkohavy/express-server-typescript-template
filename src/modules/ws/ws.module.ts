import { ActionsEventHandler } from './event-handlers/actions';
import { ConnectionEventHandler } from './event-handlers/connection';
import { StaticTopics } from './logic/constants';
import { TopicRegistrationActions } from './services/actions/topic-registration.actions';
import type { TopicMessage } from '../../lib/ws-client';
import type { Application } from 'express';

export class WsModule {
  private connectionEventHandler!: ConnectionEventHandler;
  private actionsEventHandler!: ActionsEventHandler;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsClient, logger } = this.app;

    this.connectionEventHandler = new ConnectionEventHandler(wsClient, logger);

    const topicRegistrationActions = new TopicRegistrationActions(wsClient, logger);
    this.actionsEventHandler = new ActionsEventHandler(wsClient, logger, {
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

        this.app.wsClient.publishToTopic(eventData);
      }, 4000);
    }
  }
}
