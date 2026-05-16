import type { ClientMessage } from '@src/common/types';

/**
 * Used for both topic registration and un-registration.
 * Same structure for both events.
 */
export type TopicRegistrationPayload = {
  topic: string;
};

export type TopicRegistrationMessage = Required<ClientMessage<TopicRegistrationPayload>>;
