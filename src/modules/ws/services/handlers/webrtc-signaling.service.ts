import { BUILT_IN_WEBSOCKET_EVENTS, type WebsocketManager } from '@src/lib/websocket-manager';
import {
  SocketEvents,
  type WebRtcEventValues,
  type WebRtcSignalValues,
  WebRtcSignals,
  getWebRtcToReceiversTopic,
  getWebRtcToSenderTopic,
} from '../../logic/constants';
import type { ActionHandler } from '../../types';
import type { WebRtcSignalingPayload } from '../interfaces/webrtc-signaling.service.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket } from 'ws';

/**
 * WebRTC signaling service: uses topic pub/sub so one sender can have multiple receivers
 * and receivers can live on any server instance. Sender and receivers register with a socketId;
 * offers/answers and ICE are published to session-specific topics and delivered via Redis.
 */
export class WebRtcSignalingService {
  private readonly senderSocketsBySessionId = new Map<string, WebSocket>();
  private readonly handlersByType: Record<WebRtcSignalValues, ActionHandler>;

  constructor(
    private readonly wsManager: WebsocketManager,
    private readonly logger: LoggerService,
  ) {
    this.handlersByType = this.getHandlersByType();
  }

  getActionHandlers(): Record<WebRtcEventValues, ActionHandler> {
    return {
      [SocketEvents.WebRtc]: this.handleWebRtcMessage.bind(this),
    };
  }

  private getHandlersByType(): Record<WebRtcSignalValues, ActionHandler> {
    return {
      [WebRtcSignals.Sender]: this.handleSenderSignal.bind(this),
      [WebRtcSignals.Receiver]: this.handleReceiverSignal.bind(this),
      [WebRtcSignals.CreateOffer]: this.handleCreateOfferSignal.bind(this),
      [WebRtcSignals.CreateAnswer]: this.handleCreateAnswerSignal.bind(this),
      [WebRtcSignals.IceCandidate]: this.handleIceCandidateSignal.bind(this),
    };
  }

  private clearSender(socket: WebSocket): void {
    this.senderSocketsBySessionId.delete(socket.id);

    this.logger.log('WebRTC sender disconnected', { socketId: socket.id });
    return;
  }

  private attachCloseListener(socket: WebSocket): void {
    socket.on(BUILT_IN_WEBSOCKET_EVENTS.Close, () => {
      this.clearSender(socket);
    });
  }

  private async handleWebRtcMessage(socket: WebSocket, data: WebRtcSignalingPayload): Promise<void> {
    const { type: signalType } = data ?? {};

    if (!signalType) {
      this.logger.debug('WebRTC signaling: missing payload.type', { data });
      return;
    }

    const handler = this.handlersByType[signalType];

    if (!handler) {
      this.logger.debug('WebRTC signaling: unknown payload.type', { signalType });
      return;
    }

    await handler(socket, data);
  }

  private async handleSenderSignal(socket: WebSocket, data: any): Promise<void> {
    const { sessionId } = data;

    if (!sessionId) {
      this.logger.debug('WebRTC signaling: missing sessionId', { data });
      return;
    }

    const topic = getWebRtcToSenderTopic(sessionId);
    const wasSubscribed = await this.wsManager.subscribeToTopic(socket, topic);

    if (!wasSubscribed) {
      this.logger.debug('WebRTC sender already subscribed to session', { sessionId });
    }

    this.senderSocketsBySessionId.set(sessionId, socket);

    this.attachCloseListener(socket);

    this.logger.log('WebRTC sender registered', { sessionId });
  }

  private async handleReceiverSignal(socket: WebSocket, data: any): Promise<void> {
    const { sessionId } = data;

    if (!sessionId) {
      this.logger.debug('WebRTC signaling: missing sessionId', { data });
      return;
    }

    const topic = getWebRtcToReceiversTopic(sessionId);
    const wasSubscribed = await this.wsManager.subscribeToTopic(socket, topic);

    if (!wasSubscribed) {
      this.logger.debug('WebRTC receiver already subscribed to session', { sessionId });
    }

    this.logger.log('WebRTC receiver registered', { sessionId });
  }

  private async handleCreateOfferSignal(socket: WebSocket, data: any): Promise<void> {
    const { sessionId } = data;

    if (!sessionId) {
      this.logger.debug('WebRTC signaling: missing sessionId', { data });
      return;
    }

    if (this.senderSocketsBySessionId.get(sessionId) !== socket) {
      this.logger.debug('WebRTC: createOffer from non-sender socket', { sessionId });
      return;
    }

    const topic = getWebRtcToReceiversTopic(sessionId);

    await this.wsManager.publishToTopic({ topic, data });

    this.logger.debug('WebRTC: relayed offer to receivers', { sessionId });
  }

  private async handleCreateAnswerSignal(_socket: WebSocket, data: any): Promise<void> {
    const sessionId = data.sessionId;

    if (!sessionId) {
      this.logger.debug('WebRTC signaling: missing sessionId', { data });
      return;
    }

    const topic = getWebRtcToSenderTopic(sessionId);

    await this.wsManager.publishToTopic({ topic, data });

    this.logger.debug('WebRTC: relayed answer to sender', { sessionId });
  }

  private async handleIceCandidateSignal(socket: WebSocket, data: any): Promise<void> {
    const sessionId = data.sessionId;

    if (!sessionId) {
      this.logger.debug('WebRTC signaling: missing sessionId', { data });
      return;
    }

    const isSender = this.senderSocketsBySessionId.get(sessionId) === socket;

    const topic = isSender ? getWebRtcToReceiversTopic(sessionId) : getWebRtcToSenderTopic(sessionId);
    this.logger.debug(`WebRTC: relayed ICE to ${isSender ? 'receivers' : 'sender'}`, { sessionId });

    await this.wsManager.publishToTopic({ topic, data });
  }
}
