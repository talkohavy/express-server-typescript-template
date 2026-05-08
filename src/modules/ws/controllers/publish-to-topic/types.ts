import type { ClientMessage } from '../../types';
import type { TopicPayload } from '@src/lib/websocket-manager';

export type TopicMessage = Required<ClientMessage<TopicPayload>>;
