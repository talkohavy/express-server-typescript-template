import { WsStateController } from './controllers/ws-state.controller';
import type { Application } from 'express';

export class RedisDebugModule {
  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.attachControllers();
  }

  private attachControllers(): void {
    const wsStateController = new WsStateController(this.app);

    wsStateController.registerRoutes();
  }
}
