import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { WsConnectionContext, IConnectionPipeline } from '../types';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket } from 'ws';

export class AttachErrorHandlerToSocketMiddleware implements IConnectionPipeline {
  constructor(private readonly logger: LoggerService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    this.attachErrorHandlerToSocket(socket);
  }

  private attachErrorHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Error, (error) => {
      this.logger.error('WebSocket error', { error });
    });
  }
}
