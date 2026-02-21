import { randomUUID } from 'node:crypto';
import { BUILT_IN_WEBSOCKET_EVENTS } from '@src/lib/ws-client/logic/constants';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebsocketClient } from '@src/lib/ws-client';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

export class ConnectionEventHandler {
  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {}

  attachSocketIdToConnection(socket: WebSocket) {
    socket.id = randomUUID();
  }

  extractIpFromWebsocket(req: IncomingMessage) {
    const isXForwardedForHeaderPresent = req?.headers?.['x-forwarded-for'];

    if (isXForwardedForHeaderPresent && typeof isXForwardedForHeaderPresent === 'string') {
      const ipFromXForwardedForHeader = isXForwardedForHeaderPresent.split(',')[0]?.trim();
      return ipFromXForwardedForHeader;
    }

    const ipFromSocket = req.socket.remoteAddress;

    return ipFromSocket;
  }

  registerEventHandlers(): void {
    this.wsClient.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (ws, req) => {
      this.attachSocketIdToConnection(ws);

      const ip = this.extractIpFromWebsocket(req) ?? 'unknown';

      this.logger.log('new ws connection', { ip });

      ws.on(BUILT_IN_WEBSOCKET_EVENTS.Error, (error) => {
        this.logger.error('WebSocket error', { ip, error });
      });

      ws.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
        // Clean up all topic subscriptions for this client (fire-and-forget)
        this.wsClient.unsubscribeFromAllTopics(ws);
        this.logger.log('ws connection closed', { ip });
      });
    });
  }
}
