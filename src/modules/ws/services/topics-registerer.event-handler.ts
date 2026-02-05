import type { LoggerService } from '../../../lib/logger-service';
import type { WebSocketServer } from 'ws';

export class TopicsRegistererEventHandler {
  constructor(
    private readonly wss: WebSocketServer,
    private readonly logger: LoggerService,
  ) {}

  registerEventHandlers(): void {
    this.wss.on('connection', (ws) => {
      this.logger.log('new ws connection');

      ws.on('error', console.error);

      ws.on('message', function message(data) {
        console.log('received: %s', data);
      });

      // ws.send('something');
    });
  }
}
