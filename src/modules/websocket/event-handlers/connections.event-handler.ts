import type { Socket, Server as SocketIOServer } from 'socket.io';
import type { LoggerService } from '../../../lib/logger-service';
import type { SocketType } from '../types';
import { SOCKET_EVENTS } from '../logic/constants';
import { getMasterRoomByConnectionId } from '../logic/utils/getMasterRoomByConnectionId';
import { getSocketData } from '../logic/utils/getSocketData';

export class ConnectionsEventHandler {
  constructor(
    private readonly io: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  async joinMasterRoom(socket: SocketType, _data: any) {
    this.logger.debug(`[${SOCKET_EVENTS.Connection.JoinMasterRoom}] user joined master room`);

    const { user } = getSocketData(socket);
    const { id: userId } = user;

    const masterRoomName = getMasterRoomByConnectionId(userId);
    socket.join(masterRoomName);
  }

  registerEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`New socket connection for users: ${socket.id}`);

      // Authenticate socket on connection
      // this.handleAuthentication(socket);

      socket.on(SOCKET_EVENTS.Connection.JoinMasterRoom, (data) => this.joinMasterRoom(socket, data));

      socket.on('disconnect', (reason) => {
        this.logger.info(`User socket disconnected: ${socket.id}, reason: ${reason}`);
      });
    });
  }
}
