import express, { type Application } from 'express';
import { optimizedApp } from '../../common/constants';
import { AppFactory } from '../../lib/lucky-server/app-factory';
import { AuthenticationModule } from '../../modules/authentication';
import { BackendModule } from '../../modules/backend';
import { BooksModule } from '../../modules/books';
import { DragonsModule } from '../../modules/dragons';
import { FileUploadModule } from '../../modules/file-upload';
import { HealthCheckModule } from '../../modules/health-check';
// import { ServerSentEventModule } from '../../modules/serverSentEvents';
import { WebsocketModule } from '../../modules/websocket';
import { SwaggerModule } from '../../modules/swagger';
import { UsersModule } from '../../modules/users';
import { bodyLimitPlugin } from '../../plugins/bodyLimit.plugin';
import { callContextPlugin } from '../../plugins/call-context.plugin';
import { configServicePlugin } from '../../plugins/config-service.plugin';
import { cookieParserPlugin } from '../../plugins/cookieParser.plugin';
import { corsPlugin } from '../../plugins/cors/cors.plugin';
import { errorHandlerPlugin } from '../../plugins/errorHandler.plugin';
import { helmetPlugin } from '../../plugins/helmet.plugin';
import { loggerPlugin } from '../../plugins/logger.plugin';
import { pathNotFoundPlugin } from '../../plugins/pathNotFound.plugin';
import { postgresPlugin } from '../../plugins/postgres.plugin';
import { redisPlugin } from '../../plugins/redis.plugin';
import { addIdToRequestPlugin } from '../../plugins/request-id.plugin';
import { urlEncodedPlugin } from '../../plugins/urlEncoded.plugin';
import { socketIOPlugin } from '../../plugins/socket.io.plugin';

export async function buildApp() {
  const app = express() as unknown as Application;

  app.disable('x-powered-by');

  const appModule = new AppFactory(app, optimizedApp);

  await appModule.registerPlugins([
    configServicePlugin,
    callContextPlugin,
    addIdToRequestPlugin,
    loggerPlugin, // <--- dependencies: config-service plugin, call-context plugin
    postgresPlugin, // <--- dependencies: config-service plugin
    redisPlugin, // <--- dependencies: config-service plugin
    socketIOPlugin,
    corsPlugin,
    helmetPlugin,
    bodyLimitPlugin,
    urlEncodedPlugin,
    cookieParserPlugin,
  ]);

  appModule.registerModules([
    // - Main modules (service providers)
    HealthCheckModule,
    AuthenticationModule,
    UsersModule,
    BooksModule,
    DragonsModule,
    FileUploadModule,
    WebsocketModule,
    // - BFF module (route provider) - requires Main modules to be ready
    BackendModule,
    // - Utility modules
    // ServerSentEventModule,
    SwaggerModule,
  ]);

  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
