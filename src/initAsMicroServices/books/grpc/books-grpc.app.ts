import { Environment, optimizedApp } from '@src/common/constants';
import { ConfigKeys } from '@src/configurations';
import { LogLevel, type LogLevelValues } from '@src/lib/logger';
import { AppFactory } from '@src/lib/lucky-server';
import { BooksGrpcModule } from '@src/modules/booksGrpc';
import { callContextPlugin } from '@src/plugins/call-context.plugin';
import { loggerPlugin } from '@src/plugins/logger.plugin';
import { configServicePluggable } from '../../shared/plugins/configService.plugin';
import type { Server } from '@grpc/grpc-js';
import type { LoggerServiceSettings } from '@src/configurations';

export async function buildBooksGrpcApp(app: Server) {
  const appModule = new AppFactory(app, optimizedApp); // optimizedApp

  await appModule.registerPlugins([configServicePluggable(configSettings), callContextPlugin, loggerPlugin]);

  appModule.registerModules([
    // - Main modules (service providers)
    // HealthCheckModule,
    BooksGrpcModule,
  ]);
}

const configSettings = {
  [ConfigKeys.Port]: Number(process.env.BOOKS_GRPC_PORT) || 8002,
  isDev: !!process.env.IS_DEV,
  isCI: !!process.env.IS_CI,
  [ConfigKeys.LogSettings]: {
    serviceName: 'books-grpc-service',
    logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
    logEnvironment: Environment.Dev,
    useColoredOutput: process.env.NODE_ENV !== 'production',
  } as LoggerServiceSettings,
};
