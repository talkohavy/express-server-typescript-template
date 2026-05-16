import { BUILT_IN_WEBSOCKET_EVENTS, type TopicSubscriberService } from '@src/core/topic-subscriber';
import {
  SocketEvents,
  type WebRtcSignalValues,
  WebRtcSignals,
  getWebRtcToReceiversTopic,
  getWebRtcToSenderTopic,
} from '../../logic/constants';
import { ValidateWebRtcMessageMiddleware } from '../../middleware/validate-webrtc-message.middleware';
import type { WebSocket } from 'ws';
import type { LoggerService } from '@src/core/logger-service';
import type { TopicPublisherService } from '@src/core/topic-publisher';
import type { EventHandlerFactory } from '@src/lib/lucky-server';
import type { MessageDispatcherByEventService } from '../../services/message-dispatcher-by-event';
import type { ActionHandler } from '../../types';
import type { WebRtcSignalingMessage, WebRtcSignalingPayload } from './types';

/**
 * WebRTC signaling controller: uses topic pub/sub so one sender can have multiple receivers
 * and receivers can live on any server instance. Sender and receivers register with a socketId;
 * offers/answers and ICE are published to session-specific topics and delivered via Redis.
 */
export class WebRtcSignalingController implements EventHandlerFactory {
  private readonly senderSocketsBySessionId = new Map<string, WebSocket>();
  private readonly handlersByType: Record<WebRtcSignalValues, ActionHandler>;

  constructor(
    private readonly topicPublisherService: TopicPublisherService,
    private readonly topicSubscriberService: TopicSubscriberService,
    private readonly messageDispatcherByEventService: MessageDispatcherByEventService,
    private readonly logger: LoggerService,
  ) {
    this.handlersByType = this.buildHandlersByType();
  }

  attachEventHandlers(): void {
    const validateWebRtcMessageMiddleware = new ValidateWebRtcMessageMiddleware(this.logger).use();

    this.messageDispatcherByEventService.register({
      event: SocketEvents.WebRtc,
      middlewares: [validateWebRtcMessageMiddleware],
      handler: this.handleWebRtcMessage.bind(this),
    });
  }

  private buildHandlersByType(): Record<WebRtcSignalValues, ActionHandler> {
    return {
      [WebRtcSignals.Sender]: this.handleSenderSignal.bind(this),
      [WebRtcSignals.Receiver]: this.handleReceiverSignal.bind(this),
      [WebRtcSignals.CreateOffer]: this.handleCreateOfferSignal.bind(this),
      [WebRtcSignals.CreateAnswer]: this.handleCreateAnswerSignal.bind(this),
      [WebRtcSignals.IceCandidate]: this.handleIceCandidateSignal.bind(this),
    };
  }

  private async handleWebRtcMessage(socket: WebSocket, message: WebRtcSignalingMessage): Promise<void> {
    const { payload } = message;
    const { type: signalType } = payload;

    const handler = this.handlersByType[signalType];

    if (!handler) {
      this.logger.debug('WebRTC signaling: unknown payload.type', { signalType });
      return;
    }

    await handler(socket, payload);
  }

  private async handleSenderSignal(socket: WebSocket, payload: WebRtcSignalingPayload): Promise<void> {
    const { sessionId } = payload;

    const topic = getWebRtcToSenderTopic(sessionId);
    const wasSubscribed = await this.topicSubscriberService.subscribe(socket, topic);

    if (!wasSubscribed) {
      this.logger.debug('WebRTC sender already subscribed to session', { sessionId });
    }

    this.senderSocketsBySessionId.set(sessionId, socket);

    this.attachCloseListener(socket);

    this.logger.log('WebRTC sender registered', { sessionId });
  }

  private async handleReceiverSignal(socket: WebSocket, payload: WebRtcSignalingPayload): Promise<void> {
    const { sessionId } = payload;

    const topic = getWebRtcToReceiversTopic(sessionId);
    const wasSubscribed = await this.topicSubscriberService.subscribe(socket, topic);

    if (!wasSubscribed) {
      this.logger.debug('WebRTC receiver already subscribed to session', { sessionId });
    }

    this.logger.log('WebRTC receiver registered', { sessionId });
  }

  private async handleCreateOfferSignal(socket: WebSocket, payload: WebRtcSignalingPayload): Promise<void> {
    const { sessionId } = payload;

    if (this.senderSocketsBySessionId.get(sessionId) !== socket) {
      this.logger.debug('WebRTC: createOffer from non-sender socket', { sessionId });
      return;
    }

    const topic = getWebRtcToReceiversTopic(sessionId);

    await this.topicPublisherService.publishToTopic({ topic, data: payload });

    this.logger.debug('WebRTC: relayed offer to receivers', { sessionId });
  }

  private async handleCreateAnswerSignal(_socket: WebSocket, payload: WebRtcSignalingPayload): Promise<void> {
    const { sessionId } = payload;

    const topic = getWebRtcToSenderTopic(sessionId);

    await this.topicPublisherService.publishToTopic({ topic, data: payload });

    this.logger.debug('WebRTC: relayed answer to sender', { sessionId });
  }

  private async handleIceCandidateSignal(socket: WebSocket, payload: WebRtcSignalingPayload): Promise<void> {
    const { sessionId } = payload;

    const isSender = this.senderSocketsBySessionId.get(sessionId) === socket;

    const topic = isSender ? getWebRtcToReceiversTopic(sessionId) : getWebRtcToSenderTopic(sessionId);
    this.logger.debug(`WebRTC: relayed ICE to ${isSender ? 'receivers' : 'sender'}`, { sessionId });

    await this.topicPublisherService.publishToTopic({ topic, data: payload });
  }

  private clearSender(socket: WebSocket): void {
    this.senderSocketsBySessionId.delete(socket.id);

    this.logger.log('WebRTC sender disconnected', { socketId: socket.id });
  }

  private attachCloseListener(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
      this.clearSender(socket);
    });
  }
}
