import { ResponseTypes } from '../../logic/constants';
import type { ActionHandler } from '../../types';
import type { ActionsEventPayload, SendResponseProps } from './interfaces/actions.event-handler.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { ServerSocketResponse } from '@src/lib/websocket-manager';
import type WebSocket from 'ws';

/**
 * Domain event handler for the "actions" event.
 * Handles incoming action payloads (e.g. register/unregister to topics) and delegates
 * to domain-specific handlers under services/actions (e.g. topic-registration.actions.ts).
 *
 * Does not listen to WebSocket "message" directly; invoked by MessageDispatcherEventHandler
 * when message.event === "actions".
 */
export class ActionsEventHandler {
  constructor(
    private readonly logger: LoggerService,
    private readonly actionHandlersByAction: Record<string, ActionHandler>,
  ) {}

  /**
   * Called by the message dispatcher when event === "actions".
   */
  async handleEvent(socket: WebSocket, payload: unknown): Promise<void> {
    if (!this.isValidActionsPayload(payload)) {
      this.logger.debug('Received invalid actions payload', { payload });
      this.sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Received invalid/bad message' });
      return;
    }

    const actionHandler = this.actionHandlersByAction[payload.action];

    if (!actionHandler) {
      this.logger.debug('Received unknown action', { payload });
      this.sendResponse({ socket, type: ResponseTypes.ServerError, message: 'Unknown action' });
      return;
    }

    try {
      await actionHandler(socket, payload);
    } catch (error) {
      this.logger.error('Error handling action message', { payload, error });
      this.sendResponse({ socket, type: ResponseTypes.ServerError, message: 'Internal server error' });
    }
  }

  private isValidActionsPayload(payload: any): payload is ActionsEventPayload {
    return typeof payload?.action === 'string';
  }

  private sendResponse(props: SendResponseProps): void {
    const { socket, type, message } = props;

    if (socket.readyState !== socket.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    socket.send(JSON.stringify(response));
  }
}
