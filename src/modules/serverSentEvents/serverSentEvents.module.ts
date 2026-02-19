import { ServerSentEventsController } from './controllers/serverSentEvents.controller';
import { ServerSentEventsService } from './services/serverSentEvents.service';
import type { Application } from 'express';

/**
 * @dependencies
 * - redis plugin
 * - logger plugin
 */
export class ServerSentEventModule {
  private serverSentEventsService!: ServerSentEventsService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    const { pub: redisPubClient, sub: redisSubClient } = this.app.redis;

    this.serverSentEventsService = new ServerSentEventsService(this.app.logger, redisPubClient, redisSubClient);

    // SSE always attaches routes directly - clients connect to this endpoint
    // without going through the BFF (persistent connections don't proxy well)
    this.attachControllers(this.app);
  }

  private attachControllers(app: Application): void {
    const controller = new ServerSentEventsController(app, this.serverSentEventsService);

    controller.registerRoutes();

    this.serverSentEventsService.runSimulation();
  }
}
