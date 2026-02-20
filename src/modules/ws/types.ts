import type { WebSocket } from 'ws';

export type ActionHandler = (ws: WebSocket, payload: any) => Promise<void>;
