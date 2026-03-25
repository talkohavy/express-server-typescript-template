import { ConfigKeys, type LoggerServiceSettings } from '../configurations';
import { Logger, LogLevel, type LoggerSettings } from '../lib/logger';
import { LoggerService } from '../lib/logger-service';
import type { CallContextService } from '../lib/call-context';
import type { Application } from 'express';

/**
 * @dependencies
 * - config-service plugin
 * - call-context plugin
 */
export function loggerPlugin(app: Application) {
  const { configService, callContextService } = app;

  const logSettings = configService.get(ConfigKeys.LogSettings);

  const loggerService = initLoggerService(logSettings, callContextService);

  app.logger = loggerService;
}

function initLoggerService(logSettings: LoggerServiceSettings, callContextService: CallContextService): LoggerService {
  const settings: LoggerSettings = {
    logLevel: logSettings.logLevel || LogLevel.Debug,
    useColoredOutput: logSettings.useColoredOutput ?? true,
  };

  const fixedKeys: Record<string, any> = {
    serviceName: logSettings.serviceName || 'my-service',
    environment: logSettings.logEnvironment,
  };

  const logger = new Logger({ settings, fixedKeys });

  const loggerService = new LoggerService(logger, callContextService);

  return loggerService;
}
