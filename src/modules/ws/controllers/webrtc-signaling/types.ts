import type { ClientMessage } from '../../types';

export type WebRtcSignalingPayload = {
  sessionId: string;
} & (
  | { type: 'sender' }
  | { type: 'receiver' }
  | { type: 'createOffer'; sdp: RTCSessionDescriptionInit }
  | { type: 'createAnswer'; sdp: RTCSessionDescriptionInit }
  | { type: 'iceCandidate'; candidate: RTCIceCandidateInit }
);

export type WebRtcSignalingMessage = Required<ClientMessage<WebRtcSignalingPayload>>;
