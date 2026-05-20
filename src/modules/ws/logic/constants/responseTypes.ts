export const ResponseTypes = {
  ConnectionAcknowledged: 'connection_acknowledged',
  Actions: {
    RegisterSuccess: 'register_success',
    RegisterError: 'register_error',
    UnregisterSuccess: 'unregister_success',
    UnregisterError: 'unregister_error',
    SendSuccess: 'send_success',
    SendError: 'send_error',
  },
  WebRTC: {
    CreateOfferSuccess: 'create_offer_success',
    CreateAnswerSignalSuccess: 'create_answer_success',
    ReceiverSignalSent: 'receiver_signal_sent',
    SenderSignalSent: 'sender_signal_sent',
    Error: {
      NoSuchType: 'no_such_type',
      CreateOfferFromNonSender: 'create_offer_from_non_sender',
    },
  },
  ValidationError: 'validation_error',
  ServerError: 'server_error',
};
