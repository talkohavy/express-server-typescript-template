import { createEventMessage } from '../utils/createEventMessage';
import type { ControllerFactory } from '../../../lib/lucky-server';
import type { ServerSentEventsService } from '../services/serverSentEvents.service';
import type { Application } from 'express';

export class ServerSentEventsController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly serverSentEventsService: ServerSentEventsService,
  ) {}

  private connectToChannel() {
    this.app.get('/api/sse', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');

      this.serverSentEventsService.addClient(res);

      const message = createEventMessage({ content: 'Connection was successful!', eventName: 'connect' });

      res.write(message);
      res.flushHeaders();

      req.on('close', () => {
        this.serverSentEventsService.removeClient(res);

        res.end();
      });
    });
  }

  registerRoutes() {
    this.connectToChannel();
  }
}
