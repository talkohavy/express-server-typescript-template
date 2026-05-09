import { API_PATHS } from '@src/common/constants';
import type { Application } from 'express';
import type { ControllerFactory } from '@src/lib/lucky-server';

export class HealthCheckController implements ControllerFactory {
  constructor(private readonly app: Application) {}

  registerRoutes() {
    this.healthCheck();
  }

  private healthCheck() {
    this.app.get(API_PATHS.healthCheck, async (_req, res) => {
      this.app.logger.info(`GET ${API_PATHS.healthCheck} - performing health check`);

      res.json({ status: 'OK' });
    });
  }
}
