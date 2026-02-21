import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket, WebSocketServer } from 'ws';

export class CloseEventHandler {
  constructor(
    private readonly wsApp: WebSocketServer,
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  private attachCloseHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
      this.wsManager.unsubscribeFromAllTopics(socket);

      this.logger.log('ws connection closed', { socketId: socket.id });
    });
  }

  registerEventHandlers(): void {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket, _req) => {
      this.attachCloseHandlerToSocket(socket);
    });
  }
}
