import type WebSocket from 'ws';

type BroadcastOptions = {
  binary?: boolean;
};

export type BroadcastToAllProps = {
  data: string | Buffer | ArrayBufferView;
  options?: BroadcastOptions;
};

export type BroadcastToAllButSelfProps = {
  self: WebSocket;
  data: string | Buffer | ArrayBufferView;
  options?: BroadcastOptions;
};
