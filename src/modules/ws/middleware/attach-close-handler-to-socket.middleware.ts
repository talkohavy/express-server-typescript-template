import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { WsConnectionContext, IConnectionPipeline } from '../types';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

export class AttachCloseHandlerToSocketMiddleware implements IConnectionPipeline {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    this.attachCloseHandlerToSocket(socket);
  }

  private attachCloseHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
      this.wsManager.unsubscribeFromAllTopics(socket); // <--- redis cleanup! remove phantom keys

      this.logger.log('ws connection closed', { socketId: socket.id });
    });
  }
}
