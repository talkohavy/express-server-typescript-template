import { parseJson } from '../../../../common/utils/parseJson';
import { BUILT_IN_WEBSOCKET_EVENTS, type WebsocketClient, type ServerSocketResponse } from '../../../../lib/ws-client';
import { ResponseTypes, StaticTopics } from '../../logic/constants';
import { Actions } from './logic/constants';
import type { LoggerService } from '../../../../lib/logger-service';
import type {
  ActionMessageData,
  SendResponseProps,
  TopicRegistrationPayload,
  TopicUnregisterPayload,
} from './interfaces/actions.event-handler.interface';
import type { WebSocket } from 'ws';

export class ActionsEventHandler {
  private incomingMessageHandlersByAction: Record<any, (ws: WebSocket, payload: any) => Promise<void>>;

  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {
    this.incomingMessageHandlersByAction = this.createActionHandler();
  }

  /**
   * Handle incoming WebSocket messages for topic registration/unregister.
   */
  private async handleIncomingActionMessage(ws: WebSocket, data: Buffer): Promise<void> {
    const message = parseJson<ActionMessageData>(data);

    if (!this.isValidActionMessage(message)) {
      this.logger.debug('Received invalid/bad message', { message });

      this.sendResponse({ ws, type: ResponseTypes.ValidationError, message: 'Received invalid/bad message' });

      return;
    }

    const { payload } = message;

    const actionHandler = this.incomingMessageHandlersByAction[payload.action];

    if (!actionHandler) {
      this.logger.debug('Received unknown action', { payload });

      this.sendResponse({ ws, type: ResponseTypes.ServerError, message: 'Unknown action' });

      return;
    }

    try {
      await actionHandler(ws, payload);
    } catch (error) {
      this.logger.error('Error handling topic message', { payload, error });

      this.sendResponse({ ws, type: ResponseTypes.ServerError, message: 'Internal server error' });
    }
  }

  private async handleTopicRegistration(ws: WebSocket, payload: TopicRegistrationPayload): Promise<void> {
    const { topic } = payload;

    if (!topic) {
      this.logger.debug('Topic is required', { payload });

      this.sendResponse({ ws, type: ResponseTypes.ValidationError, message: 'Topic is required' });

      return;
    }

    const isSuccess = await this.wsClient.subscribeToTopic(ws, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { topic });

      this.sendResponse({
        ws,
        type: ResponseTypes.Actions.RegisterSuccess,
        message: 'Already subscribed',
      });
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

    const isSuccess = await this.wsClient.unsubscribeFromTopic(ws, topic);

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

  private isValidActionMessage(message: ActionMessageData | null): message is ActionMessageData {
    return !!message && message.topic === StaticTopics.Actions && !!message.payload?.action;
  }

  /**
   * Extend this to add more action handlers.
   */
  private createActionHandler() {
    return {
      [Actions.Register]: this.handleTopicRegistration.bind(this),
      [Actions.Unregister]: this.handleTopicUnregister.bind(this),
    };
  }

  registerEventHandlers(): void {
    this.wsClient.wss.on(BUILT_IN_WEBSOCKET_EVENTS.Connection, (ws) => {
      ws.on(BUILT_IN_WEBSOCKET_EVENTS.Message, (data: Buffer) => {
        this.handleIncomingActionMessage(ws, data);
      });
    });
  }
}
