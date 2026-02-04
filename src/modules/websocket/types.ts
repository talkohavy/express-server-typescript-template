import type { DefaultEventsMap, Socket } from 'socket.io';

export type SocketData = {
  user: {
    id: string;
  };
};

export type SocketType = Socket<DefaultEventsMap, any, DefaultEventsMap, SocketData>;
