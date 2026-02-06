import type { LoggerService } from '../../../lib/logger-service';
import type { WebsocketClient } from '../../../lib/ws-client';

export class TopicsRegistererEventHandler {
  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {}

  registerEventHandlers(): void {
    this.wsClient.wss.on('connection', (ws) => {
      this.logger.log('new ws connection');

      ws.on('error', console.error);

      ws.on('message', function message(data: Buffer) {
        console.log('received: %s', data);
      });

      ws.on('close', () => {
        this.logger.log('ws connection closed');
      });

      // ws.send('something');
    });
  }
}
