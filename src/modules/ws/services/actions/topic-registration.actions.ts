import { ResponseTypes } from '../../logic/constants';
import { Actions } from './logic/constants';
import type { ActionHandler } from '../../types';
import type {
  SendResponseProps,
  TopicRegistrationPayload,
  TopicUnregisterPayload,
} from './interfaces/actions.event-handler.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { ServerSocketResponse, WebsocketManager } from '@src/lib/websocket-manager';
import type { WebSocket } from 'ws';

export class TopicRegistrationActions {
  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {}

  private async handleTopicRegistration(ws: WebSocket, payload: TopicRegistrationPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      this.sendResponse({ ws, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.subscribeToTopic(ws, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { topic });
      this.sendResponse({ ws, type: ResponseTypes.Actions.RegisterSuccess, message: 'Already subscribed' });
    }

    this.logger.log('Client registered to topic', { topic });
    this.sendResponse({ ws, type: ResponseTypes.Actions.RegisterSuccess });
  }

  private async handleTopicUnregister(ws: WebSocket, payload: TopicUnregisterPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });
      this.sendResponse({ ws, type: ResponseTypes.ValidationError, message: 'Topic is required' });
      return;
    }

    const isSuccess = await this.wsManager.unsubscribeFromTopic(ws, topic);

    if (!isSuccess) {
      this.logger.debug('Client not subscribed to topic', { topic });
      this.sendResponse({ ws, type: ResponseTypes.Actions.UnregisterSuccess, message: 'Not subscribed' });
    }

    this.logger.log('Client unregistered from topic', { topic });

    this.sendResponse({ ws, type: ResponseTypes.Actions.UnregisterSuccess });
  }

  private sendResponse(props: SendResponseProps): void {
    const { ws, type, message } = props;

    if (ws.readyState !== ws.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    ws.send(JSON.stringify(response));
  }

  getActionHandlers(): Record<string, ActionHandler> {
    return {
      [Actions.Register]: this.handleTopicRegistration,
      [Actions.Unregister]: this.handleTopicUnregister,
    };
  }
}
