import { TopicsRegistererEventHandler } from './event-handlers/topics-registerer.event-handler';
import { SOCKET_EVENTS, TOPICS } from './logic/constants';
import type { Application } from 'express';
import type { Server as SocketIOServer } from 'socket.io';

export class SocketIOModule {
  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.attachEventHandlers();
  }

  private attachEventHandlers(): void {
    const { io, logger } = this.app;

    const topicsRegistererEventHandler = new TopicsRegistererEventHandler(io, logger);

    topicsRegistererEventHandler.registerEventHandlers();

    this.fakeEmitEventsStream(io);
  }

  fakeEmitEventsStream(io: SocketIOServer) {
    setInterval(() => {
      // Everyone will get this:
      // this.io.emit(SOCKET_EVENTS.Topics.EventsStream, { message: 'Hello, world!' });

      // TODO: this needs to be generic, and support multiple dynamic topics.
      // Send everyone:
      io.to(TOPICS.EventsStream).emit(SOCKET_EVENTS.Data, { message: 'Hello, world!' });
    }, 4000);
  }
}
