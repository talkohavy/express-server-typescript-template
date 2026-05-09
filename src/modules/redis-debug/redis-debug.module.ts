import { WsStateController } from './controllers/ws-state.controller';
import type { Application } from 'express';
import type { ModuleFactory } from '@src/lib/lucky-server';

export class RedisDebugModule implements ModuleFactory {
  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    this.attachControllers();
  }

  private attachControllers(): void {
    const wsStateController = new WsStateController(this.app);

    wsStateController.registerRoutes();
  }
}
