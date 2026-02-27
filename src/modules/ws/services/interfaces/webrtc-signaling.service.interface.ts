/**
 * WebRTC signaling message types.
 * Clients send { event: 'webrtc', payload: WebrtcSignalingPayload }.
 */
export type WebRtcSignalingPayload =
  | { type: 'sender' }
  | { type: 'receiver' }
  | { type: 'createOffer'; sdp: RTCSessionDescriptionInit }
  | { type: 'createAnswer'; sdp: RTCSessionDescriptionInit }
  | { type: 'iceCandidate'; candidate: RTCIceCandidateInit };
