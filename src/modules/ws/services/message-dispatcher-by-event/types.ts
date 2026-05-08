import type { SocketEventValues } from '../../logic/constants';
import type { ActionHandler, WsMiddleware } from '../../types';

export type RegisterProps = {
  event: SocketEventValues;
  middlewares?: WsMiddleware[];
  handler: ActionHandler;
};
