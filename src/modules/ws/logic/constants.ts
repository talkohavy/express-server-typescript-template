export const StaticTopics = {
  Actions: 'actions',
  Data: 'data',
  /**
   * Every connected socket is auto-subscribed to this topic; use for broadcastToAll.
   */
  Presence: 'presence',
};

export const ResponseTypes = {
  Actions: {
    RegisterSuccess: 'register_success',
    RegisterError: 'register_error',
    UnregisterSuccess: 'unregister_success',
    UnregisterError: 'unregister_error',
  },
  ValidationError: 'validation_error',
  ServerError: 'server_error',
};
