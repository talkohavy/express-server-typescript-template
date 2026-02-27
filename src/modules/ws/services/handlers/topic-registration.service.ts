import { type RegistrationEventValues, ResponseTypes, SocketEvents } from '../../logic/constants';
import type { EventHandler } from '../../types';
import type {
  SendResponseProps,
  TopicRegistrationPayload,
  TopicUnregisterPayload,
} from '../interfaces/topic-registration.service.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { ServerSocketResponse, WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

export class TopicRegistrationService {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Called by the action dispatcher when payload.action === "register".
   */
  private async handleTopicRegistration(socket: WebSocket, payload: TopicRegistrationPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      this.sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.subscribeToTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { topic });
      this.sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess, message: 'Already subscribed' });
      return;
    }

    this.logger.log('Client registered to topic', { topic });
    this.sendResponse({ socket, type: ResponseTypes.Actions.RegisterSuccess });
  }

  /**
   * Called by the action dispatcher when action === "unregister".
   */
  private async handleTopicUnregister(socket: WebSocket, payload: TopicUnregisterPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      this.sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.unsubscribeFromTopic(socket, topic);

    if (!isSuccess) {
      this.logger.debug('Client not subscribed to topic', { topic });
      this.sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess, message: 'Not subscribed' });
      return;
    }

    this.logger.log('Client unregistered from topic', { topic });

    this.sendResponse({ socket, type: ResponseTypes.Actions.UnregisterSuccess });
  }

  private sendResponse(props: SendResponseProps): void {
    const { socket, type, message } = props;

    if (socket.readyState !== socket.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    socket.send(JSON.stringify(response));
  }

  getEventHandlers(): Record<RegistrationEventValues, EventHandler> {
    return {
      [SocketEvents.Register]: this.handleTopicRegistration.bind(this),
      [SocketEvents.Unregister]: this.handleTopicUnregister.bind(this),
    };
  }
}
