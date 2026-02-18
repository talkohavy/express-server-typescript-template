import type { CallContextService } from '../lib/call-context';
import type { ConfigService } from '../lib/config-service';
import type { LoggerService } from '../lib/logger-service';
import type { WebsocketClient } from '../lib/ws-client';
import type { AuthenticationModule } from '../modules/authentication';
import type { BooksModule } from '../modules/books';
import type { DragonsModule } from '../modules/dragons';
import type { FileUploadModule } from '../modules/file-upload';
import type { HealthCheckModule } from '../modules/health-check';
import type { RedisDebugModule } from '../modules/redis-debug';
import type { SwaggerModule } from '../modules/swagger';
import type { UsersModule } from '../modules/users';
import type { Server as HttpServer } from 'http';
import type { Client as PgClient } from 'pg';
import type { RedisClientType } from 'redis';
import type { Server as SocketIOServer } from 'socket.io';

export interface OptimizedApp {
  modules: {
    AuthenticationModule: AuthenticationModule;
    HealthCheckModule: HealthCheckModule;
    UsersModule: UsersModule;
    BooksModule: BooksModule;
    DragonsModule: DragonsModule;
    FileUploadModule: FileUploadModule;
    RedisDebugModule: RedisDebugModule;
    SwaggerModule: SwaggerModule;
  };
  configService: ConfigService;
  callContextService: CallContextService;
  redis: {
    pub: RedisClientType;
    sub: RedisClientType;
  };
  pg: PgClient;
  logger: LoggerService;
  httpServer: HttpServer;
  io: SocketIOServer;
  wsClient: WebsocketClient;
}

export type UserToken = {
  id: string;
  role: string;
};
