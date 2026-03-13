import { AuthenticationEventHandler } from './event-handlers/authentication.event-handler';
import { PrivateMasterRoomEventHandler } from './event-handlers/private-master-room.event-handler';
import { PublishMessageToTopicEventHandler } from './event-handlers/publish-message-to-topic.event-handler';
import { TopicsRegistererEventHandler } from './event-handlers/topics-registerer.event-handler';
import { SOCKET_EVENTS, StaticTopics } from './logic/constants';
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

    const authenticationEventHandler = new AuthenticationEventHandler(socketIOApp, logger); // <--- authenticates socket on connection
    const privateMasterRoomEventHandler = new PrivateMasterRoomEventHandler(socketIOApp, logger); // <--- automatically registers socket to private master room on connection
    const topicsRegistererEventHandler = new TopicsRegistererEventHandler(socketIOApp, logger); // <--- ready to accept topics registrations from clients
    const publishMessageToTopicEventHandler = new PublishMessageToTopicEventHandler(socketIOApp, logger); // <--- Serves as our action handler

    authenticationEventHandler.registerEventHandlers();
    privateMasterRoomEventHandler.registerEventHandlers();
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
