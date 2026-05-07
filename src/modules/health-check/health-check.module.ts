import { HealthCheckController } from './controllers/health-check.controller';
import type { ModuleFactory } from '@src/lib/lucky-server';
import type { Application } from 'express';

export class HealthCheckModule implements ModuleFactory {
  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers();
    }
  }

  private attachControllers(): void {
    const controller = new HealthCheckController(this.app);

    controller.registerRoutes();
  }
}
