import { StaticTopics } from '../logic/constants';
import type { WsConnectionContext, IConnectionPipeline } from '../types';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketManager } from '@src/lib/websocket-manager';

export class SubscribeSocketToRootTopicMiddleware implements IConnectionPipeline {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  async handleConnection(props: WsConnectionContext): Promise<void> {
    const { socket } = props;

    const topic = StaticTopics.Presence;

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Socket already in presence topic on connect', { socketId: socket.id });

      return;
    }

    this.logger.debug('Socket subscribed to presence', { socketId: socket.id });
  }
}
