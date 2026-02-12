import express, { type Application } from 'express';
import { Environment, optimizedApp } from '../../common/constants';
import { LogLevel, type LogLevelValues } from '../../lib/logger';
import { AppFactory } from '../../lib/lucky-server/app-factory';
import { DragonsModule } from '../../modules/dragons';
import { HealthCheckModule } from '../../modules/health-check';
import { bodyLimitPlugin } from '../../plugins/bodyLimit.plugin';
import { callContextPlugin } from '../../plugins/call-context.plugin';
import { cookieParserPlugin } from '../../plugins/cookieParser.plugin';
import { corsPlugin } from '../../plugins/cors/cors.plugin';
import { errorHandlerPlugin } from '../../plugins/errorHandler.plugin';
import { helmetPlugin } from '../../plugins/helmet.plugin';
import { loggerPlugin } from '../../plugins/logger.plugin';
import { pathNotFoundPlugin } from '../../plugins/pathNotFound.plugin';
import { redisPlugin } from '../../plugins/redis.plugin';
import { addIdToRequestPlugin } from '../../plugins/request-id.plugin';
import { urlEncodedPlugin } from '../../plugins/urlEncoded.plugin';
import { configServicePluggable } from '../shared/plugins/configService.plugin';

const configSettings = {
  port: 8003,
  isDev: !!process.env.IS_DEV,
  isCI: !!process.env.IS_CI,
  logSettings: {
    serviceName: 'dragons-service',
    logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
    logEnvironment: Environment.Dev,
    useColoredOutput: process.env.NODE_ENV !== 'production',
  },
  redis: {
    connectionString: process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379',
  },
};

export async function buildApp() {
  const app = express() as unknown as Application;

  app.disable('x-powered-by');

  const appModule = new AppFactory(app, optimizedApp);

  await appModule.registerPlugins([
    configServicePluggable(configSettings),
    callContextPlugin,
    addIdToRequestPlugin,
    loggerPlugin, // <--- dependencies: config-service plugin, call-context plugin
    redisPlugin, // <--- dependencies: config-service plugin
    corsPlugin,
    helmetPlugin,
    bodyLimitPlugin,
    urlEncodedPlugin,
    cookieParserPlugin,
  ]);

  appModule.registerModules([
    // - Main modules (service providers)
    HealthCheckModule,
    DragonsModule,
  ]);

  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
