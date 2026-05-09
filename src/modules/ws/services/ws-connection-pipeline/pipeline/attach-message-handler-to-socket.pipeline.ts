import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager';
import type { WsConnectionContext, IConnectionPipeline } from '../../../types';
import type { MessageDispatcherByEventService } from '../../message-dispatcher-by-event/message-dispatcher-by-event.service';

export class AttachMessageHandlerToSocketPipeline implements IConnectionPipeline {
  constructor(private readonly messageDispatcherByEventService: MessageDispatcherByEventService) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Message, (data: Buffer) => {
      this.messageDispatcherByEventService.dispatchMessage(socket, data);
    });
  }
}
