import { ResponseTypes, SocketEvents } from '../logic/constants';
import { sendResponse } from '../logic/utils/sendResponse';
import { requireWsPermissionMiddleware } from '../middleware/require-ws-permission.middleware';
import type { MessageDispatcherByEventService } from '../services/message-dispatcher-by-event';
import type { LoggerService } from '@src/lib/logger-service';
import type { EventHandlerFactory } from '@src/lib/lucky-server';
import type { TopicMessage, WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

type HandleSendMessagePayload<T = any> = TopicMessage<T>;

/**
 * Handles the "send" event: client publishes a message to a topic.
 * All subscribers of that topic (including other clients) receive the message.
 */
export class PublishController implements EventHandlerFactory {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
    private readonly messageDispatcher: MessageDispatcherByEventService,
  ) {}

  attachEventHandlers(): void {
    this.messageDispatcher.register({
      event: SocketEvents.Send,
      middlewares: [requireWsPermissionMiddleware],
      handler: this.handleSendMessage.bind(this),
    });
  }

  private async handleSendMessage(socket: WebSocket, payload: HandleSendMessagePayload): Promise<void> {
    const { topic, data } = payload;

    const validatedData = this.validateMessageData(data);

    if (!validatedData) {
      this.logger.debug('Send action: invalid message data', { payload });
      sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'data must be an object' });
      return;
    }

    try {
      await this.wsManager.publishToTopic({ topic, data });

      this.logger.debug('Client published to topic', { topic, socketId: socket.id });

      sendResponse({ socket, type: ResponseTypes.Actions.SendSuccess });
    } catch (error) {
      this.logger.error('Send action: publish failed', { topic, error });

      sendResponse({ socket, type: ResponseTypes.Actions.SendError, message: 'Failed to publish' });
    }
  }

  private validateMessageData(data: unknown): Record<string, unknown> | null {
    if (data === null || typeof data !== 'object') return null;

    return data as Record<string, unknown>;
  }
}
