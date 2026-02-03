import type { Application } from 'express';
import { ConnectionsEventHandler } from './event-handlers/connections.event-handler';

export class WebsocketModule {
  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.attachEventHandlers();
  }

  private attachEventHandlers(): void {
    const { io, logger } = this.app;

    const connectionsEventHandler = new ConnectionsEventHandler(io, logger);

    connectionsEventHandler.registerEventHandlers();
  }
}
