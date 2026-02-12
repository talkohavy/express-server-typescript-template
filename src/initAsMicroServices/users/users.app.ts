import express, { type Application } from 'express';
import { Environment, optimizedApp } from '../../common/constants';
import { LogLevel, type LogLevelValues } from '../../lib/logger';
import { AppFactory } from '../../lib/lucky-server/app-factory';
import { HealthCheckModule } from '../../modules/health-check';
import { UsersModule } from '../../modules/users';
import { bodyLimitPlugin } from '../../plugins/bodyLimit.plugin';
import { callContextPlugin } from '../../plugins/call-context.plugin';
import { cookieParserPlugin } from '../../plugins/cookieParser.plugin';
import { corsPlugin } from '../../plugins/cors/cors.plugin';
import { errorHandlerPlugin } from '../../plugins/errorHandler.plugin';
import { helmetPlugin } from '../../plugins/helmet.plugin';
import { loggerPlugin } from '../../plugins/logger.plugin';
import { pathNotFoundPlugin } from '../../plugins/pathNotFound.plugin';
import { postgresPlugin } from '../../plugins/postgres.plugin';
import { addRequestIdHeaderPlugin } from '../../plugins/request-id.plugin';
import { urlEncodedPlugin } from '../../plugins/urlEncoded.plugin';
import { configServicePluggable } from '../shared/plugins/configService.plugin';

const configSettings = {
  port: 8005,
  isDev: !!process.env.IS_DEV,
  isCI: !!process.env.IS_CI,
  logSettings: {
    serviceName: 'users-service',
    logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
    logEnvironment: Environment.Dev,
    useColoredOutput: process.env.NODE_ENV !== 'production',
  },
  postgres: {
    connectionString: process.env.POSTGRES_CONNECTION_STRING || 'postgres://user:password@localhost:5432/mydb',
  },
};

export async function buildApp() {
  const app = express() as unknown as Application;

  app.disable('x-powered-by');

  const appModule = new AppFactory(app, optimizedApp);

  await appModule.registerPlugins([
    configServicePluggable(configSettings),
    callContextPlugin,
    addRequestIdHeaderPlugin,
    loggerPlugin, // <--- dependencies: config-service plugin, call-context plugin
    postgresPlugin, // <--- dependencies: config-service plugin
    corsPlugin,
    helmetPlugin,
    bodyLimitPlugin,
    urlEncodedPlugin,
    cookieParserPlugin,
  ]);

  appModule.registerModules([
    // - Main modules (service providers)
    HealthCheckModule,
    UsersModule,
  ]);

  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
