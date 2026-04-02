import type { PingPongService } from '../services/ping-pong.service';
import type { WsConnectionContext, IConnectionPipeline } from '../types';

export class AttachPongHandlerToSocketMiddleware implements IConnectionPipeline {
  constructor(private readonly pingPongService: PingPongService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    this.pingPongService.registerSocketToPingPong(socket);
  }
}
