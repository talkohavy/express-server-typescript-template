import { SOCKET_EVENTS, TOPICS } from '../logic/constants';
import { getMasterRoomByUserId } from '../logic/utils/getMasterRoomByUserId';
import { getSocketData } from '../logic/utils/getSocketData';
import type { LoggerService } from '../../../lib/logger-service';
import type { SocketType } from '../types';
import type { Socket, Server as SocketIOServer } from 'socket.io';

export class TopicsRegistererEventHandler {
  constructor(
    private readonly io: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  async registerToTopic(socket: SocketType, data: any) {
    const { topic } = data ?? {};

    if (!topic) {
      this.logger.error('Topic is required');
      socket.emit(SOCKET_EVENTS.NotificationCenter, { error: 'Topic is required' });
      return;
    }

    this.logger.debug('[registerToTopic] user registered to topic', { topic: TOPICS.EventsStream });

    socket.join(topic);
  }

  async joinSocketToMasterUserRoom(socket: SocketType) {
    this.logger.debug(`[${SOCKET_EVENTS.NotificationCenter}] user joined master room`);

    const { user } = getSocketData(socket);
    const { id: userId } = user;

    const masterRoomName = getMasterRoomByUserId(userId);
    socket.join(masterRoomName);
  }

  registerEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info('New socket connection for TopicsRegistererEventHandler', { socketId: socket.id });

      // Authenticate socket on connection
      // this.handleAuthentication(socket);
      socket.data.user = { id: '123' }; // <--- fake user id for testing purposes.

      // Server does this automatically:
      this.joinSocketToMasterUserRoom(socket);

      // Client sends this manually, by demand:
      socket.on(SOCKET_EVENTS.RegisterToTopic, (data) => this.registerToTopic(socket, data));

      socket.on('disconnect', (reason) => {
        this.logger.info('User socket disconnected from TopicsRegistererEventHandler', { socketId: socket.id, reason });
      });
    });
  }
}
