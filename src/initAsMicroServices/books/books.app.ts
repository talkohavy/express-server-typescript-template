import express, { type Application } from 'express';
import { Environment, optimizedApp } from '../../common/constants';
import { LogLevel, type LogLevelValues } from '../../lib/logger';
import { AppFactory } from '../../lib/lucky-server/app-factory';
import { BooksModule } from '../../modules/books';
import { HealthCheckModule } from '../../modules/health-check';
import { bodyLimitPlugin } from '../../plugins/bodyLimit.plugin';
import { callContextPlugin } from '../../plugins/call-context.plugin';
import { cookieParserPlugin } from '../../plugins/cookieParser.plugin';
import { corsPlugin } from '../../plugins/cors/cors.plugin';
import { errorHandlerPlugin } from '../../plugins/errorHandler.plugin';
import { helmetPlugin } from '../../plugins/helmet.plugin';
import { loggerPlugin } from '../../plugins/logger.plugin';
import { pathNotFoundPlugin } from '../../plugins/pathNotFound.plugin';
import { addRequestIdHeaderPlugin } from '../../plugins/request-id.plugin';
import { urlEncodedPlugin } from '../../plugins/urlEncoded.plugin';
import { configServicePluggable } from '../shared/plugins/configService.plugin';

const configSettings = {
  port: 8002,
  isDev: !!process.env.IS_DEV,
  isCI: !!process.env.IS_CI,
  logSettings: {
    serviceName: 'books-service',
    logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
    logEnvironment: Environment.Dev,
    useColoredOutput: process.env.NODE_ENV !== 'production',
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
    corsPlugin,
    helmetPlugin,
    bodyLimitPlugin,
    urlEncodedPlugin,
    cookieParserPlugin,
  ]);

  appModule.registerModules([
    // - Main modules (service providers)
    HealthCheckModule,
    BooksModule,
  ]);

  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
