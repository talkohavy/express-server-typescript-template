import { BUILT_IN_WEBSOCKET_EVENTS } from '../logic/constants';
import { getMasterRoomByUserId } from '../logic/utils/getMasterRoomByUserId';
import type { SocketType } from '../types';
import type { LoggerService } from '@src/lib/logger-service';
import type { Server as SocketIOServer } from 'socket.io';

export class PrivateMasterRoomEventHandler {
  constructor(
    private readonly socketIOApp: SocketIOServer,
    private readonly logger: LoggerService,
  ) {}

  private async subscribeSocketToPrivateMasterRoom(socket: SocketType): Promise<void> {
    const userId = socket.data.user.id;

    const masterRoomName = getMasterRoomByUserId(userId);

    await socket.join(masterRoomName);

    this.logger.debug(`socket joined user private master room. userId: ${userId} - socketId: ${socket.id}`);
  }

  registerEventHandlers(): void {
    this.socketIOApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket) => {
      this.subscribeSocketToPrivateMasterRoom(socket);
    });
  }
}
