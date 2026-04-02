import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/websocket-manager/logic/constants';
import type { IConnectionPipeline } from '../../types';
import type { WebSocketServer } from 'ws';

/**
 * Registers a single `connection` listener and runs all steps in order, awaiting each
 * (including async steps). Multiple `wsApp.on('connection', async () => …)` handlers do not
 * guarantee completion order — later handlers can run before earlier async work finishes.
 */
export class WsConnectionPipelineService {
  constructor(private readonly wsApp: WebSocketServer) {}

  register(wsMiddlewares: IConnectionPipeline[]): void {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, async (socket, request) => {
      for (const wsMiddleware of wsMiddlewares) {
        await wsMiddleware.handleConnection({ socket, request });
      }
    });
  }
}
