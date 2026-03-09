import { BUILT_IN_WEBSOCKET_EVENTS } from '../logic/constants';
import type { LoggerService } from '../../../lib/logger-service';
import type { SocketType } from '../types';
import type { Socket, Server as SocketIOServer } from 'socket.io';

export class AuthenticationEventHandler {
  constructor(
    private readonly socketIOApp: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  private async authenticateSocket(socket: SocketType) {
    this.logger.debug('Authenticating socket', { socketId: socket.id });

    socket.data.user = { id: '123' }; // <--- fake user id for testing purposes.
  }

  registerEventHandlers() {
    this.socketIOApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket: Socket) => {
      this.authenticateSocket(socket);
    });
  }
}
