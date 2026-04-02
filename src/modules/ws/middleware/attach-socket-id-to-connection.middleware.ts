import { randomUUID } from 'node:crypto';
import type { WsConnectionContext, IConnectionPipeline } from '../types';

export class AttachSocketIdToConnectionMiddleware implements IConnectionPipeline {
  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.id = randomUUID();
  }
}
