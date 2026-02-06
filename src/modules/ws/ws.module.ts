import { TopicsRegistererEventHandler } from './services/topics-registerer.event-handler';
import type { Application } from 'express';

export class WsModule {
  private topicsRegistererEventHandler!: TopicsRegistererEventHandler;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { wsClient, logger } = this.app;

    this.topicsRegistererEventHandler = new TopicsRegistererEventHandler(wsClient, logger);

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.topicsRegistererEventHandler.registerEventHandlers();
  }
}
