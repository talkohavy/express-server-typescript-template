import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager';
import type { WsConnectionContext, IConnectionPipeline } from '../../../types';
import type { PingPongService } from '../../ping-pong/ping-pong.service';

export class AttachPongHandlerToSocketPipeline implements IConnectionPipeline {
  constructor(private readonly pingPongService: PingPongService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Pong, () => {
      this.pingPongService.markSocketAlive(socket);
    });

    this.pingPongService.registerSocketToPingPong(socket);
  }
}
