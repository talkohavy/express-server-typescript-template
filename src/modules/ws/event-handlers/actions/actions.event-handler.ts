import { parseJson } from '@src/common/utils/parseJson';
import { BUILT_IN_WEBSOCKET_EVENTS, type WebsocketClient, type ServerSocketResponse } from '@src/lib/ws-client';
import { ResponseTypes, StaticTopics } from '../../logic/constants';
import type { ActionHandler } from '../../types';
import type { ActionMessageData, SendResponseProps } from './interfaces/actions.event-handler.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket } from 'ws';

/**
 * @description
 * Handles incoming WebSocket actions.
 *
 * An action is an incoming message (of type `ActionMessageData`) from the socket client,
 * containing a payload with an `action` field. Implementation is delegated to domain-specific
 * handlers under `domains/` (e.g. topic registration/unregister in `domains/topic.actions.ts`).
 *
 * To add new actions: implement a handler in the appropriate domain (or create a new domain file),
 * export a map of action -> handler, and merge it in `createActionHandlerMap`.
 */
export class ActionsEventHandler {
  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
    private readonly actionHandlersByAction: Record<string, ActionHandler>,
  ) {}

  /**
   * Handle incoming WebSocket messages and dispatch to the right domain action handler.
   */
  private async handleIncomingActionMessage(ws: WebSocket, data: Buffer): Promise<void> {
    const message = parseJson<ActionMessageData>(data);

    if (!this.isValidActionMessage(message)) {
      this.logger.debug('Received invalid/bad message', { message });

      this.sendResponse({ ws, type: ResponseTypes.ValidationError, message: 'Received invalid/bad message' });

      return;
    }

    const { payload } = message;
    const actionHandler = this.actionHandlersByAction[payload.action];

    if (!actionHandler) {
      this.logger.debug('Received unknown action', { payload });

      this.sendResponse({ ws, type: ResponseTypes.ServerError, message: 'Unknown action' });

      return;
    }

    try {
      await actionHandler(ws, payload);
    } catch (error) {
      this.logger.error('Error handling action message', { payload, error });

      this.sendResponse({ ws, type: ResponseTypes.ServerError, message: 'Internal server error' });
    }
  }

  private sendResponse(props: SendResponseProps): void {
    const { ws, type, message } = props;

    if (ws.readyState !== ws.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    ws.send(JSON.stringify(response));
  }

  private isValidActionMessage(message: ActionMessageData | null): message is ActionMessageData {
    return message?.topic === StaticTopics.Actions && !!message.payload?.action;
  }

  registerEventHandlers(): void {
    this.wsClient.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (ws) => {
      ws.on(BUILT_IN_WEBSOCKET_EVENTS.Message, (data: Buffer) => {
        this.handleIncomingActionMessage(ws, data);
      });
    });
  }
}
