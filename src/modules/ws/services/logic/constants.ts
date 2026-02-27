export const Actions = {
  Register: 'register',
  Unregister: 'unregister',
  Send: 'send',
} as const;

export type ActionValues = (typeof Actions)[keyof typeof Actions];
