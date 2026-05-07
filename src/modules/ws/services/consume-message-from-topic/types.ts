import type { WebSocket } from 'ws';

/**
 * A function that intercepts a topic message before it is forwarded to a specific socket.
 * Return a (possibly modified) data object to forward, or `null` to skip this socket entirely.
 */
export type TopicMessageInterceptor = (props: {
  topic: string;
  data: Record<string, unknown>;
  socket: WebSocket;
}) => Record<string, unknown> | null;
