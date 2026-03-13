import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import { StaticTopics } from '../logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket, WebSocketServer } from 'ws';

export class SubscribeSocketToRootTopicMiddleware {
  constructor(
    private readonly wsApp: WebSocketServer,
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  use() {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket) => {
      this.subscribeSocketToRootTopic(socket);
    });
  }

  private async subscribeSocketToRootTopic(socket: WebSocket): Promise<void> {
    const topic = StaticTopics.Presence;

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Socket already in presence topic on connect', { socketId: socket.id });
      return;
    }

    this.logger.debug('Socket subscribed to presence', { socketId: socket.id });
  }
}
