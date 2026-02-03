import type { DefaultEventsMap, Socket } from 'socket.io';

export type SocketData = {
  user: any;
};

export type SocketType = Socket<DefaultEventsMap, any, DefaultEventsMap, SocketData>;
