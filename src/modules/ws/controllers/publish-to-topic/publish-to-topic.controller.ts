import { ResponseTypes, SocketEvents } from '../../logic/constants';
import { sendResponse } from '../../logic/utils/sendResponse';
import { requireWsPermissionMiddleware } from '../../middleware/require-ws-permission.middleware';
import { ValidateActionMiddleware } from '../../middleware/validate-action.middleware';
import type { MessageDispatcherByEventService } from '../../services/message-dispatcher-by-event';
import type { HandleSendMessagePayload } from './types';
import type { LoggerService } from '@src/lib/logger-service';
import type { EventHandlerFactory } from '@src/lib/lucky-server';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

/**
 * Handles the "send" event: client publishes a message to a topic.
 * All subscribers of that topic (including other clients) receive the message.
 */
export class PublishToTopicController implements EventHandlerFactory {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
    private readonly messageDispatcher: MessageDispatcherByEventService,
  ) {}

  attachEventHandlers(): void {
    const validateActionMiddleware = new ValidateActionMiddleware(this.logger).use();

    this.messageDispatcher.register({
      event: SocketEvents.Publish,
      middlewares: [validateActionMiddleware, requireWsPermissionMiddleware],
      handler: this.handlePublishMessageToTopic.bind(this),
    });
  }

  private async handlePublishMessageToTopic(socket: WebSocket, payload: HandleSendMessagePayload): Promise<void> {
    const { topic, data } = payload;

    try {
      await this.wsManager.publishToTopic({ topic, data });

      this.logger.debug('Client published to topic', { topic, socketId: socket.id });

      sendResponse({ socket, type: ResponseTypes.Actions.SendSuccess });
    } catch (error) {
      this.logger.error('Send action: publish failed', { topic, error });

      sendResponse({ socket, type: ResponseTypes.Actions.SendError, message: 'Failed to publish' });
    }
  }
}
