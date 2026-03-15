import type { LoggerService } from '../../../lib/logger-service';
import type { MiddlewareFactory } from '../../../lib/lucky-server';
import type { SocketType } from '../types';
import type { Server as SocketIOServer } from 'socket.io';

export class AuthenticationMiddleware implements MiddlewareFactory {
  constructor(
    private readonly socketIOApp: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  use() {
    this.socketIOApp.use((socket: SocketType, next: (err?: any) => void) => {
      this.authenticateSocket(socket);

      next();
    });
  }

  private async authenticateSocket(socket: SocketType) {
    this.logger.debug('Authenticating socket', { socketId: socket.id });

    socket.data.user = { id: '123' }; // <--- fake user id for testing purposes.
  }
}
