export const BUILT_IN_WEBSOCKET_EVENTS = {
  Connection: 'connection',
  Close: 'close',
  Ping: 'ping',
  Pong: 'pong',
} as const;

export const STATIC_TOPICS = {
  Actions: {
    Register: 'actions:register',
    Unregister: 'actions:unregister',
  },
  Data: 'data',
};
