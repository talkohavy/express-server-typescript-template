import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { PingPongService } from '../services/ping-pong.service';
import type { WsConnectionContext, IConnectionPipeline } from '../types';

export class AttachPongHandlerToSocketMiddleware implements IConnectionPipeline {
  constructor(private readonly pingPongService: PingPongService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Pong, () => {
      this.pingPongService.markSocketAlive(socket);
    });

    this.pingPongService.registerSocketToPingPong(socket);
  }
}
