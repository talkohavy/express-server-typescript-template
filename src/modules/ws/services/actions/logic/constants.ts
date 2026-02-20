export const Actions = {
  Register: 'register',
  Unregister: 'unregister',
} as const;

export type ActionValues = (typeof Actions)[keyof typeof Actions];
