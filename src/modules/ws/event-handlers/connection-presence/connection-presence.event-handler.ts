import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import { StaticTopics } from '../../logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket, WebSocketServer } from 'ws';

/**
 * Subscribes each new socket to the presence topic on connection.
 * Sockets are removed from all topics (including presence) on close via CloseEventHandler.
 * Use StaticTopics.Presence with publishToTopic to implement broadcastToAll.
 */
export class ConnectionPresenceEventHandler {
  constructor(
    private readonly wsApp: WebSocketServer,
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  private async subscribeSocketToPresence(socket: WebSocket): Promise<void> {
    const topic = StaticTopics.Presence;

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Socket already in presence topic on connect', { socketId: socket.id });
      return;
    }

    this.logger.debug('Socket subscribed to presence', { socketId: socket.id });
  }

  registerEventHandlers(): void {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket) => {
      this.subscribeSocketToPresence(socket);
    });
  }
}
