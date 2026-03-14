import { optimizedApp } from './common/constants';
import { AppFactory } from './lib/lucky-server/app-factory';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { pathNotFoundHandler } from './middlewares/pathNotFoundHandler.middleware';
import { AuthenticationModule } from './modules/authentication';
import { BackendModule } from './modules/backend';
import { BooksModule } from './modules/books';
import { DragonsModule } from './modules/dragons';
import { FileUploadModule } from './modules/file-upload';
import { HealthCheckModule } from './modules/health-check';
import { RedisDebugModule } from './modules/redis-debug';
// import { ServerSentEventModule } from './modules/serverSentEvents';
import { SocketIOModule } from './modules/socketio';
import { SwaggerModule } from './modules/swagger';
import { UsersModule } from './modules/users';
import { WsModule } from './modules/ws';
import { bodyLimitPlugin } from './plugins/bodyLimit.plugin';
import { callContextPlugin } from './plugins/call-context.plugin';
import { configServicePlugin } from './plugins/config-service.plugin';
import { cookieParserPlugin } from './plugins/cookieParser.plugin';
import { corsPlugin } from './plugins/cors/cors.plugin';
import { fetchPermissionsPlugin } from './plugins/fetch-permissions.plugin';
import { helmetPlugin } from './plugins/helmet.plugin';
import { loggerPlugin } from './plugins/logger.plugin';
import { postgresPlugin } from './plugins/postgres.plugin';
import { redisPlugin } from './plugins/redis.plugin';
import { addRequestIdHeaderPlugin } from './plugins/request-id.plugin';
import { socketIOPlugin } from './plugins/socket.io.plugin';
import { urlEncodedPlugin } from './plugins/urlEncoded.plugin';
import { wsPlugin } from './plugins/ws.plugin';
import type { Application } from 'express';

const websocketModule = process.env.WEBSOCKET_MODULE;
const isSocketIOModuleEnabled = websocketModule === 'socket.io';
const isWsModuleEnabled = websocketModule === 'ws';

export async function buildApp(app: Application) {
  const appModule = new AppFactory(app, optimizedApp);

  await appModule.registerPlugins([
    // infrastructure plugins:
    configServicePlugin,
    callContextPlugin,
    loggerPlugin, // <--- dependencies: config-service plugin, call-context plugin
    postgresPlugin, // <--- dependencies: config-service plugin
    redisPlugin, // <--- dependencies: config-service plugin
    isSocketIOModuleEnabled && socketIOPlugin,
    isWsModuleEnabled && wsPlugin,
    // middleware plugins:
    addRequestIdHeaderPlugin,
    corsPlugin,
    helmetPlugin,
    bodyLimitPlugin,
    urlEncodedPlugin,
    cookieParserPlugin,
    fetchPermissionsPlugin,
  ]);

  appModule.registerModules([
    // - Main modules (service providers)
    HealthCheckModule,
    AuthenticationModule,
    UsersModule,
    BooksModule,
    DragonsModule,
    FileUploadModule,
    isSocketIOModuleEnabled && SocketIOModule, // <--- To make the SocketIO module work, make sure you comment out the wsPlugin above, and the WsModule below. Otherwise, you will get the error of "Invalid frame header".
    isWsModuleEnabled && WsModule,
    isWsModuleEnabled && RedisDebugModule,
    // - BFF module (route provider) - requires Main modules to be ready
    BackendModule,
    // - Utility modules
    // ServerSentEventModule,
    SwaggerModule,
  ]);

  appModule.registerErrorHandler(errorHandler);
  appModule.registerPathNotFoundHandler(pathNotFoundHandler);
}
