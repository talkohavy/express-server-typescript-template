import { ResponseTypes } from '../../../logic/constants';
import type { IConnectionPipeline, WsConnectionContext } from '../../../types';

export class ConnectionAcknowledgePipeline implements IConnectionPipeline {
  handleConnection(props: WsConnectionContext) {
    const { socket } = props;

    socket.send(JSON.stringify({ type: ResponseTypes.ConnectionAcknowledged }));
  }
}
