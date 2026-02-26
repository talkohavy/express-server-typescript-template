import { ResponseTypes } from '../../../logic/constants';
import { Actions } from '../logic/constants';
import type { ActionHandler } from '../../../types';
import type { HandleSendMessagePayload, SendResponseProps } from '../interfaces/send-message.service.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { ServerSocketResponse, WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

/**
 * Handles the "send" action: client publishes a message to a topic.
 * All subscribers of that topic (including other clients) receive the message.
 */
export class SendMessageService {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Called by the action dispatcher when payload.action === "send".
   */
  private async handleSendMessage(socket: WebSocket, payload: HandleSendMessagePayload): Promise<void> {
    const { topic, data } = payload;

    const validatedData = this.validateMessageData(data);

    if (!validatedData) {
      this.logger.debug('Send action: invalid message data', { payload });

      this.sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'data must be an object' });
      return;
    }

    try {
      await this.wsManager.publishToTopic({ topic, payload: data });

      this.logger.debug('Client published to topic', { topic, socketId: socket.id });

      this.sendResponse({ socket, type: ResponseTypes.Actions.SendSuccess });
    } catch (error) {
      this.logger.error('Send action: publish failed', { topic, error });

      this.sendResponse({ socket, type: ResponseTypes.Actions.SendError, message: 'Failed to publish' });
    }
  }

  private validateMessageData(data: unknown): Record<string, unknown> | null {
    // validate that the data is an object
    if (data === null || typeof data !== 'object') return null;

    return data as Record<string, unknown>;
  }

  private sendResponse(props: SendResponseProps): void {
    const { socket, type, message } = props;

    if (socket.readyState !== socket.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    socket.send(JSON.stringify(response));
  }

  getActionHandlers(): Record<string, ActionHandler> {
    return {
      [Actions.Send]: this.handleSendMessage.bind(this),
    };
  }
}
