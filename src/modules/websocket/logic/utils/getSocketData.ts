import type { SocketData, SocketType } from '../../types';

export function getSocketData(socket: SocketType): SocketData {
  try {
    return socket.data;
  } catch (error) {
    console.error(`Failed to extract socket data for user ${socket.id}: ${error}`);

    throw error;
  }
}
