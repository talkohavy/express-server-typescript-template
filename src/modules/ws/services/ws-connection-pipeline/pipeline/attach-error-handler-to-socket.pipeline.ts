import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/core/topic-subscriber';
import type { WebSocket } from 'ws';
import type { LoggerService } from '@src/core/logger-service';
import type { WsConnectionContext, IConnectionPipeline } from '../../../types';

export class AttachErrorHandlerToSocketPipeline implements IConnectionPipeline {
  constructor(private readonly logger: LoggerService) {}

  handleConnection(props: WsConnectionContext) {
    const { socket } = props;

    this.attachErrorHandlerToSocket(socket);
  }

  private attachErrorHandlerToSocket(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Error, (error) => {
      this.logger.error('WebSocket error', { error });
    });
  }
}
