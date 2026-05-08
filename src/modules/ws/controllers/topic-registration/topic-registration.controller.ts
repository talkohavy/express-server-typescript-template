import { ResponseTypes, SocketEvents } from '../../logic/constants';
import { sendResponse } from '../../logic/utils/sendResponse';
import { ValidateTopicNameMiddleware } from '../../middleware/validate-topic-name.middleware';
import type { MessageDispatcherByEventService } from '../../services/message-dispatcher-by-event';
import type { TopicRegistrationMessage } from './types';
import type { LoggerService } from '@src/lib/logger-service';
import type { EventHandlerFactory } from '@src/lib/lucky-server';
import type { WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

export class TopicRegistrationController implements EventHandlerFactory {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
    private readonly messageDispatcher: MessageDispatcherByEventService,
  ) {}

  attachEventHandlers(): void {
    const validateTopicNameMiddleware = new ValidateTopicNameMiddleware(this.logger).use();

    this.messageDispatcher.register({
      event: SocketEvents.Register,
      middlewares: [validateTopicNameMiddleware],
      handler: this.handleTopicRegistration.bind(this),
    });

    this.messageDispatcher.register({
      event: SocketEvents.Unregister,
      middlewares: [validateTopicNameMiddleware],
      handler: this.handleTopicUnregister.bind(this),
    });
  }

  private async handleTopicRegistration(socket: WebSocket, message: TopicRegistrationMessage): Promise<void> {
    const { topic } = message.payload;

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { topic });

      return void sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess, message: 'Already subscribed' });
    }

    this.logger.log('Client registered to topic', { topic });

    sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess });
  }

  private async handleTopicUnregister(socket: WebSocket, message: TopicRegistrationMessage): Promise<void> {
    const { topic } = message.payload;

    const isSuccess = await this.wsManager.unsubscribeFromTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client not subscribed to topic', { topic });

      return void sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess, message: 'Not subscribed' });
    }

    this.logger.log('Client unregistered from topic', { topic });

    sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess });
  }
}
