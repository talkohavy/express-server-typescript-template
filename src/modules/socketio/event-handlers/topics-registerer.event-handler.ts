import { BUILT_IN_WEBSOCKET_EVENTS, SOCKET_EVENTS } from '../logic/constants';
import type { LoggerService } from '../../../lib/logger-service';
import type { SocketType } from '../types';
import type { Socket, Server as SocketIOServer } from 'socket.io';

export class TopicsRegistererEventHandler {
  constructor(
    private readonly socketIOApp: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  private async handleRegisterToTopicEvent(socket: SocketType) {
    socket.on(SOCKET_EVENTS.RegisterToTopic, (data) => {
      this.registerSocketToTopic(socket, data);
    });
  }

  private async registerSocketToTopic(socket: SocketType, data: { topic: string }) {
    const { topic } = data ?? {};

    if (!topic) {
      this.logger.error('Topic is required');
      socket.emit(SOCKET_EVENTS.Message, { error: 'Topic is required' });
      return;
    }

    const isAlreadyRegistered = socket.rooms.has(topic);

    if (isAlreadyRegistered) {
      this.logger.warn('Socket is already registered to this topic', { socketId: socket.id, topic });
      socket.emit(SOCKET_EVENTS.Message, { error: 'User is already registered to topic' });
      return;
    }

    this.logger.debug('[registerToTopic] user registered to topic', { topic });

    socket.join(topic);
  }

  private async handleUnregisterFromTopicEvent(socket: SocketType) {
    socket.on(SOCKET_EVENTS.UnregisterFromTopic, (data) => {
      this.unregisterFromTopic(socket, data);
    });
  }

  private async unregisterFromTopic(socket: SocketType, data: { topic: string }) {
    const { topic } = data ?? {};

    if (!topic) {
      this.logger.error('Topic is required');
      socket.emit(SOCKET_EVENTS.Message, { error: 'Topic is required' });
      return;
    }

    this.logger.debug('[unregisterFromTopic] user unregistered from topic', { topic });

    socket.leave(topic);
  }

  registerEventHandlers() {
    this.socketIOApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket: Socket) => {
      this.handleRegisterToTopicEvent(socket);
      this.handleUnregisterFromTopicEvent(socket);
    });
  }
}
