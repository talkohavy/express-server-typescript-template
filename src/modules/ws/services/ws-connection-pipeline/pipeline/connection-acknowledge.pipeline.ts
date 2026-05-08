import { ResponseTypes } from '../../../logic/constants';
import type { IConnectionPipeline, WsConnectionContext } from '../../../types';

export class ConnectionAcknowledgePipeline implements IConnectionPipeline {
  constructor() {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.send(JSON.stringify({ type: ResponseTypes.ConnectionAcknowledged }));
  }
}
