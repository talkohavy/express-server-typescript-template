import { HealthCheckController } from './health-check.controller';
import type { Application } from 'express';

export class HealthCheckModule {
  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers(this.app);
    }
  }

  private attachControllers(app: Application): void {
    const controller = new HealthCheckController(app);

    controller.registerRoutes();
  }
}
