import { ResponseTypes } from '../constants';
import { sendResponse } from './sendResponse';
import type { WebSocket } from 'ws';

export function sendPermissionDeniedResponse(socket: WebSocket): void {
  sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'Permission denied' });
}
