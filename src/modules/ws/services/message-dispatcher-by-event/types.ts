import type { SocketEventValues } from '../../logic/constants';
import type { ActionHandler } from '../../types';

export type RegisterProps = {
  event: SocketEventValues;
  handler: ActionHandler;
};
