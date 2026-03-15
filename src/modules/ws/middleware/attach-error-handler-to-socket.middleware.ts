import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket, WebSocketServer } from 'ws';

export class AttachErrorHandlerToSocketMiddleware {
  constructor(
    private readonly wsApp: WebSocketServer,
    private readonly logger: LoggerService,
  ) {}

  use() {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket, _req) => {
      this.attachErrorHandlerToSocket(socket);
    });
  }

  private attachErrorHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Error, (error) => {
      this.logger.error('WebSocket error', { error });
    });
  }
}
