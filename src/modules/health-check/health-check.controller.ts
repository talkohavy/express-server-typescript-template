import { API_PATHS } from '../../common/constants';
import type { ControllerFactory } from '../../lib/lucky-server';
import type { Application } from 'express';

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
