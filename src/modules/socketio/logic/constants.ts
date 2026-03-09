export const BUILT_IN_WEBSOCKET_EVENTS = {
  Connection: 'connection',
  Disconnect: 'disconnect',
} as const;

export const SOCKET_EVENTS = {
  /**
   * Every client socket should be listening to this event for generic messages.
   */
  Message: 'message',
  RegisterToTopic: 'register-to-topic',
  SendMessageToTopic: 'send-message-to-topic',
};

export const StaticTopics = {
  Presence: 'presence',
  EventsStream: 'topics:events-stream',
} as const;
