// Registration events
const RegistrationEvents = {
  Register: 'register',
  Unregister: 'unregister',
} as const;

export type RegistrationEventValues = (typeof RegistrationEvents)[keyof typeof RegistrationEvents];

// Send events
const SendEvents = {
  Send: 'send',
} as const;

export type SendEventValues = (typeof SendEvents)[keyof typeof SendEvents];

// All socket events
export const SocketEvents = {
  ...RegistrationEvents,
  ...SendEvents,
} as const;

export type SocketEventValues = (typeof SocketEvents)[keyof typeof SocketEvents];
