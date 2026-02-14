import express, { type Application } from 'express';
import { Environment, optimizedApp } from '../../common/constants';
import { ServiceNames } from '../../configurations';
import { LogLevel, type LogLevelValues } from '../../lib/logger';
import { AppFactory } from '../../lib/lucky-server/app-factory';
import { errorHandler } from '../../middlewares/errorHandler.middleware';
import { pathNotFoundHandler } from '../../middlewares/pathNotFoundHandler.middleware';
import { BackendModule } from '../../modules/backend';
import { HealthCheckModule } from '../../modules/health-check';
import { bodyLimitPlugin } from '../../plugins/bodyLimit.plugin';
import { callContextPlugin } from '../../plugins/call-context.plugin';
import { cookieParserPlugin } from '../../plugins/cookieParser.plugin';
import { corsPlugin } from '../../plugins/cors/cors.plugin';
import { helmetPlugin } from '../../plugins/helmet.plugin';
import { loggerPlugin } from '../../plugins/logger.plugin';
import { addRequestIdHeaderPlugin } from '../../plugins/request-id.plugin';
import { urlEncodedPlugin } from '../../plugins/urlEncoded.plugin';
import { configServicePluggable } from '../shared/plugins/configService.plugin';

const configSettings = {
  port: 8000,
  isDev: !!process.env.IS_DEV,
  isCI: !!process.env.IS_CI,
  logSettings: {
    serviceName: 'backend-service',
    logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
    logEnvironment: Environment.Dev,
    useColoredOutput: process.env.NODE_ENV !== 'production',
  },
  cookies: {
    accessCookie: {
      name: 'access_token',
      domain: process.env.DOMAIN || 'localhost',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    refreshCookie: {
      name: 'refresh_token',
      domain: process.env.DOMAIN || 'localhost',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  },
  services: {
    [ServiceNames.Auth]: {
      baseUrl: process.env.AUTH_SERVICE_BASE_URL ?? 'http://localhost:8001',
    },
    [ServiceNames.Books]: {
      baseUrl: process.env.BOOKS_SERVICE_BASE_URL ?? 'http://localhost:8002',
    },
    [ServiceNames.Dragons]: {
      baseUrl: process.env.DRAGONS_SERVICE_BASE_URL ?? 'http://localhost:8003',
    },
    [ServiceNames.FileUpload]: {
      baseUrl: process.env.FILE_UPLOAD_SERVICE_BASE_URL ?? 'http://localhost:8004',
    },
    [ServiceNames.Users]: {
      baseUrl: process.env.USERS_SERVICE_BASE_URL ?? 'http://localhost:8005',
    },
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
    BackendModule,
  ]);

  appModule.registerErrorHandler(errorHandler);
  appModule.registerPathNotFoundHandler(pathNotFoundHandler);

  return app;
}
