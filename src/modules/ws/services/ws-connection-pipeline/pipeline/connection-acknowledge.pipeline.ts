import { ResponseTypes } from '../../../logic/constants';
import { sendResponse } from '../../../logic/utils/sendResponse';
import type { IConnectionPipeline, WsConnectionContext } from '../../../types';

export class ConnectionAcknowledgePipeline implements IConnectionPipeline {
  handleConnection(props: WsConnectionContext) {
    const { socket } = props;

    sendResponse({ socket, type: ResponseTypes.ConnectionAcknowledged });
  }
}
