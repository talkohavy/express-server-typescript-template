import { SocketEvents } from './socketEvents';

export const WebRtcSignals = {
  Sender: 'sender',
  Receiver: 'receiver',
  CreateOffer: 'createOffer',
  CreateAnswer: 'createAnswer',
  IceCandidate: 'iceCandidate',
} as const;

export function getWebRtcToSenderTopic(sessionId: string): string {
  return `${SocketEvents.WebRtc}:session:${sessionId}:to-sender`;
}

export function getWebRtcToReceiversTopic(sessionId: string): string {
  return `${SocketEvents.WebRtc}:session:${sessionId}:to-receivers`;
}
