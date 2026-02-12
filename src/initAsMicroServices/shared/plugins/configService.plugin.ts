import { ConfigService } from '../../../lib/config-service';
import type { Application } from 'express';

export function configServicePluggable(configSettings: Record<string, any>) {
  return function configServicePluging(app: Application) {
    const configService = new ConfigService(configSettings);

    app.configService = configService;
  };
}
