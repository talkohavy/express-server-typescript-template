export const WebRtcSignals = {
  Sender: 'sender',
  Receiver: 'receiver',
  CreateOffer: 'createOffer',
  CreateAnswer: 'createAnswer',
  IceCandidate: 'iceCandidate',
} as const;

export type WebRtcSignalingTypeValues = (typeof WebRtcSignals)[keyof typeof WebRtcSignals];
