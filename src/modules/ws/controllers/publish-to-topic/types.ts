import type { TopicPayload } from '@src/lib/websocket-manager';
import type { ClientMessage } from '../../types';

export type TopicMessage = Required<ClientMessage<TopicPayload>>;
