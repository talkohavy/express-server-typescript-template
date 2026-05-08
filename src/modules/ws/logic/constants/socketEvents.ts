// Registration events
const RegistrationEvents = {
  Register: 'register',
  Unregister: 'unregister',
} as const;

export type RegistrationEventValues = (typeof RegistrationEvents)[keyof typeof RegistrationEvents];

// Publish events
const PublishEvents = {
  Publish: 'send',
} as const;

export type PublishEventValues = (typeof PublishEvents)[keyof typeof PublishEvents];

// WebRTC signaling events (single event; payload.type distinguishes role/message type)
const WebRtcEvents = {
  WebRtc: 'web-rtc',
} as const;

export type WebRtcEventValues = (typeof WebRtcEvents)[keyof typeof WebRtcEvents];

// All socket events
export const SocketEvents = {
  ...RegistrationEvents,
  ...PublishEvents,
  ...WebRtcEvents,
} as const;

export type SocketEventValues = (typeof SocketEvents)[keyof typeof SocketEvents];
