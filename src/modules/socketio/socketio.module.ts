import { PublishMessageToTopicEventHandler } from './event-handlers/publish-message-to-topic.event-handler';
import { TopicsRegistererEventHandler } from './event-handlers/topics-registerer.event-handler';
import { SOCKET_EVENTS, StaticTopics } from './logic/constants';
import { AuthenticationMiddleware } from './middleware/authentication.middleware';
import { JoinPrivateMasterRoomMiddleware } from './middleware/join-private-master-room.middleware';
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
    const { socketIOApp, logger } = this.app;

    // middlewares:
    const authenticationMiddleware = new AuthenticationMiddleware(socketIOApp, logger);
    const joinPrivateMasterRoomEventHandler = new JoinPrivateMasterRoomMiddleware(socketIOApp, logger); // <--- automatically registers socket to private master room on connection

    authenticationMiddleware.use();
    joinPrivateMasterRoomEventHandler.use();

    // event handlers:
    const topicsRegistererEventHandler = new TopicsRegistererEventHandler(socketIOApp, logger); // <--- ready to accept topics registrations from clients
    const publishMessageToTopicEventHandler = new PublishMessageToTopicEventHandler(socketIOApp, logger); // <--- Serves as our action handler

    topicsRegistererEventHandler.registerEventHandlers();
    publishMessageToTopicEventHandler.registerEventHandlers();

    this.fakeEmitEventsStream(socketIOApp);
  }

  fakeEmitEventsStream(socketIOApp: SocketIOServer) {
    setInterval(() => {
      // Everyone will get this:
      // this.io.emit(SOCKET_EVENTS.Topics.EventsStream, { message: 'Hello, world!' });

      // TODO: this needs to be generic, and support multiple dynamic topics.
      // Send everyone:
      socketIOApp.to(StaticTopics.EventsStream).emit(SOCKET_EVENTS.Message, { message: 'Hello, world!' });
    }, 4000);
  }
}
