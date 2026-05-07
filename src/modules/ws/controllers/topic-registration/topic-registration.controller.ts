import { ResponseTypes, SocketEvents } from '../../logic/constants';
import { sendResponse } from '../../logic/utils/sendResponse';
import type { MessageDispatcherByEventService } from '../../services/message-dispatcher-by-event';
import type { TopicRegistrationPayload, TopicUnregisterPayload } from './types';
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
    this.messageDispatcher.register({ event: SocketEvents.Register, handler: this.handleTopicRegistration.bind(this) });
    this.messageDispatcher.register({ event: SocketEvents.Unregister, handler: this.handleTopicUnregister.bind(this) });
  }

  private async handleTopicRegistration(socket: WebSocket, payload: TopicRegistrationPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { topic });
      sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess, message: 'Already subscribed' });
      return;
    }

    this.logger.log('Client registered to topic', { topic });
    sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess });
  }

  private async handleTopicUnregister(socket: WebSocket, payload: TopicUnregisterPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.unsubscribeFromTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client not subscribed to topic', { topic });
      sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess, message: 'Not subscribed' });
      return;
    }

    this.logger.log('Client unregistered from topic', { topic });
    sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess });
  }
}
