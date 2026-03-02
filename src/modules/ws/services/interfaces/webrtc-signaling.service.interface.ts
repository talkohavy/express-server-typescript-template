/**
 * WebRTC signaling message types.
 * Clients send { event: 'webrtc', payload: WebrtcSignalingPayload }.
 * sessionId is required for all messages so signaling can be routed via topics (multi-receiver, cross-instance).
 */
export type WebRtcSignalingPayload = {
  sessionId: string;
} & (
  | { type: 'sender' }
  | { type: 'receiver' }
  | { type: 'createOffer'; sdp: RTCSessionDescriptionInit }
  | { type: 'createAnswer'; sdp: RTCSessionDescriptionInit }
  | { type: 'iceCandidate'; candidate: RTCIceCandidateInit }
);
