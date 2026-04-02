import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { MessageDispatcherByEventService } from '../services/message-dispatcher-by-event.service';
import type { WsConnectionContext, IConnectionPipeline } from '../types';

export class AttachMessageHandlerToSocketMiddleware implements IConnectionPipeline {
  constructor(private readonly messageDispatcherByEventService: MessageDispatcherByEventService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Message, (data: Buffer) => {
      this.messageDispatcherByEventService.dispatchMessage(socket, data);
    });
  }
}
