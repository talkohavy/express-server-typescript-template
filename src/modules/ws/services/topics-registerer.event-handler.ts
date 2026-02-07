import { parseJson } from '../../../common/utils/parseJson';
import {
  STATIC_TOPICS,
  type TopicMessage,
  type WebsocketClient,
  type ServerSocketResponse,
} from '../../../lib/ws-client';
import { ResponseTypes } from '../logic/constants';
import { extractIpFromWebsocket } from '../logic/utils/extractIpFromWebsocket';
import type { LoggerService } from '../../../lib/logger-service';
import type { SendResponseProps } from './interfaces/topics-registerer.event-handler.interface';
import type { WebSocket } from 'ws';

export class TopicsRegistererEventHandler {
  private incomingMessageHandlersByTopic: Record<any, (ws: WebSocket, topic: string, ip: string) => void>;

  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly logger: LoggerService,
  ) {
    this.incomingMessageHandlersByTopic = this.createMessageHandler();
  }

  /**
   * Handle incoming WebSocket messages for topic registration/unregister.
   */
  private handleIncomingMessage(ws: WebSocket, data: Buffer, ip: string): void {
    const message = parseJson<TopicMessage>(data);

    if (!message) {
      this.logger.debug('Received invalid/bad message', { ip, data });
      return;
    }

    const { topic } = message;

    const messageHandler = this.incomingMessageHandlersByTopic[topic];

    if (!messageHandler) {
      this.logger.debug('Received unknown message type', { ip, topic });
      return;
    }

    try {
      messageHandler(ws, topic, ip);
    } catch (error) {
      this.logger.error('Error handling topic message', { ip, topic, error });

      this.sendResponse({ ws, type: ResponseTypes.ServerError, message: 'Internal server error' });
    }
  }

  private handleTopicRegistration(ws: WebSocket, topic: string, ip: string): void {
    const isSuccess = this.wsClient.subscribeToTopic(ws, topic);

    if (!isSuccess) {
      this.logger.debug('Client is already subscribed to topic', { ip, topic });

      this.sendResponse({
        ws,
        type: ResponseTypes.Actions.RegisterSuccess,
        message: 'Already subscribed',
      });
    }

    this.logger.log('Client registered to topic', { ip, topic });

    this.sendResponse({ ws, type: ResponseTypes.Actions.RegisterSuccess });
  }

  private handleTopicUnregister(ws: WebSocket, topic: string, ip: string): void {
    const isSuccess = this.wsClient.unsubscribeFromTopic(ws, topic);

    if (!isSuccess) {
      this.logger.debug('Client not subscribed to topic', { ip, topic });
      this.sendResponse({ ws, type: ResponseTypes.Actions.UnregisterSuccess, message: 'Not subscribed' });
    }

    this.logger.log('Client unregistered from topic', { ip, topic });

    this.sendResponse({ ws, type: ResponseTypes.Actions.UnregisterSuccess });
  }

  /**
   * Send a success response to the client.
   */
  private sendResponse(props: SendResponseProps): void {
    const { ws, type, message } = props;

    if (ws.readyState !== ws.OPEN) return;

    const response: ServerSocketResponse = { type, message };

    ws.send(JSON.stringify(response));
  }

  registerEventHandlers(): void {
    this.wsClient.wss.on('connection', (ws, req) => {
      const ip = extractIpFromWebsocket(req) ?? 'unknown';

      this.logger.log('new ws connection', { ip });

      ws.on('error', (error) => {
        this.logger.error('WebSocket error', { ip, error });
      });

      ws.on('message', (data: Buffer) => {
        this.handleIncomingMessage(ws, data, ip);
      });

      ws.on('close', () => {
        // Clean up all topic subscriptions for this client
        this.wsClient.unsubscribeFromAllTopics(ws);
        this.logger.log('ws connection closed', { ip });
      });
    });
  }

  private createMessageHandler() {
    return {
      [STATIC_TOPICS.Actions.Register]: this.handleTopicRegistration.bind(this),
      [STATIC_TOPICS.Actions.Unregister]: this.handleTopicUnregister.bind(this),
    };
  }
}
