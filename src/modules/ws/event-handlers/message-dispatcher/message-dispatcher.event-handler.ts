import { parseJson } from '@src/common/utils/parseJson';
import { BUILT_IN_WEBSOCKET_EVENTS, type ServerSocketResponse } from '@src/lib/websocket-manager';
import { ResponseTypes } from '../../logic/constants';
import type { ClientMessage, MessageHandler } from '../../types';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket, WebSocketServer } from 'ws';

/**
 * Single place that listens to the WebSocket "message" event.
 * Parses JSON, validates the "event" key, and dispatches to the registered domain handler.
 * All client messages must be stringified JSON with an "event" key (Socket.IO-style).
 */
export class MessageDispatcherEventHandler {
  constructor(
    private readonly wsApp: WebSocketServer,
    private readonly handlersByEvent: Record<string, MessageHandler>,
    private readonly logger: LoggerService,
  ) {}

  private listenToMessageEvents(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Message, async (data: Buffer) => {
      const message = parseJson<ClientMessage>(data);

      if (!this.isValidClientMessage(message)) {
        this.logger.debug('Received invalid message: missing or invalid JSON / event key', { raw: data?.toString?.() });

        this.sendResponse(socket, {
          type: 'validation_error',
          message: 'Invalid message: must be stringified JSON with an "event" key',
        });

        return;
      }

      const { event, payload } = message;

      const eventHandler = this.handlersByEvent[event];

      if (!eventHandler) {
        this.logger.debug('Received unknown event', { event });
        this.sendResponse(socket, { type: ResponseTypes.ValidationError, message: 'Unknown event' });
        return;
      }

      try {
        await eventHandler(socket, payload);
      } catch (error) {
        this.logger.error('Error in event handler', { event, error });

        const response: ServerSocketResponse = { type: ResponseTypes.ServerError, message: 'Internal server error' };

        this.sendResponse(socket, response);
      }
    });
  }

  private isValidClientMessage(message: ClientMessage | null): message is ClientMessage {
    return message !== null && typeof message.event === 'string';
  }

  private sendResponse(socket: WebSocket, response: ServerSocketResponse): void {
    if (socket.readyState !== socket.OPEN) return;

    socket.send(JSON.stringify(response));
  }

  registerEventHandlers(): void {
    this.wsApp.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (socket) => {
      this.listenToMessageEvents(socket);
    });
  }
}
