import { SocketEvents, type WebRtcEventValues, WebRtcSignals } from '../../logic/constants';
import type { ActionHandler } from '../../types';
import type { WebRtcSignalingPayload } from '../interfaces/webrtc-signaling.service.interface';
import type { LoggerService } from '@src/lib/logger-service';
import type { WebSocket } from 'ws';

/**
 * WebRTC signaling service: maintains one sender and one receiver socket,
 * relays SDP offers/answers and ICE candidates between them for P2P connection setup.
 */
export class WebRtcSignalingService {
  private senderSocket: WebSocket | null = null;
  private receiverSocket: WebSocket | null = null;

  constructor(private readonly logger: LoggerService) {}

  private clearSocket(socket: WebSocket): void {
    if (this.senderSocket === socket) {
      this.senderSocket = null;
      this.logger.log('WebRTC sender disconnected');
    }
    if (this.receiverSocket === socket) {
      this.receiverSocket = null;
      this.logger.log('WebRTC receiver disconnected');
    }
  }

  private attachCloseListener(socket: WebSocket): void {
    socket.on('close', () => {
      this.clearSocket(socket);
    });
  }

  private sendToPeer(socket: WebSocket | null, message: Record<string, unknown>): void {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify(message));
  }

  private async handleWebRtcMessage(socket: WebSocket, payload: unknown): Promise<void> {
    const data = payload as WebRtcSignalingPayload;

    if (!data?.type) {
      this.logger.debug('WebRTC signaling: missing payload.type', { payload: data });
      return;
    }

    switch (data.type) {
      case WebRtcSignals.Sender: {
        this.senderSocket = socket;
        this.attachCloseListener(socket);
        this.logger.log('WebRTC sender registered');
        break;
      }
      case WebRtcSignals.Receiver: {
        this.receiverSocket = socket;
        this.attachCloseListener(socket);
        this.logger.log('WebRTC receiver registered');
        break;
      }
      case WebRtcSignals.CreateOffer: {
        if (socket !== this.senderSocket) return;
        this.logger.debug('WebRTC: relaying offer to receiver');
        this.sendToPeer(this.receiverSocket, { type: WebRtcSignals.CreateOffer, sdp: data.sdp });
        break;
      }
      case WebRtcSignals.CreateAnswer: {
        if (socket !== this.receiverSocket) return;
        this.logger.debug('WebRTC: relaying answer to sender');
        this.sendToPeer(this.senderSocket, { type: WebRtcSignals.CreateAnswer, sdp: data.sdp });
        break;
      }
      case WebRtcSignals.IceCandidate: {
        if (socket === this.senderSocket) {
          this.sendToPeer(this.receiverSocket, { type: WebRtcSignals.IceCandidate, candidate: data.candidate });
        } else if (socket === this.receiverSocket) {
          this.sendToPeer(this.senderSocket, { type: WebRtcSignals.IceCandidate, candidate: data.candidate });
        }
        break;
      }
      default: {
        this.logger.debug('WebRTC signaling: unknown payload.type', { type: (data as { type: string }).type });
      }
    }
  }

  getActionHandlers(): Record<WebRtcEventValues, ActionHandler> {
    return {
      [SocketEvents.WebRtc]: this.handleWebRtcMessage.bind(this),
    };
  }
}
