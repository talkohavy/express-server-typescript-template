import { BUILT_IN_WEBSOCKET_EVENTS } from '../../../../lib/ws-client/logic/constants';
import { attachSocketIdToConnection } from '../../logic/utils/attachSocketIdToConnection';
import { extractIpFromWebsocket } from '../../logic/utils/extractIpFromWebsocket';
import type { LoggerService } from '../../../../lib/logger-service';
import type { WebsocketClient } from '../../../../lib/ws-client';

export class ConnectionEventHandler {
  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {}

  registerEventHandlers(): void {
    this.wsClient.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (ws, req) => {
      attachSocketIdToConnection(ws);

      const ip = extractIpFromWebsocket(req) ?? 'unknown';

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
