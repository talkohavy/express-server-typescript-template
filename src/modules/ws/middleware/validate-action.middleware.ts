import { ResponseTypes } from '../logic/constants';
import { sendResponse } from '../logic/utils/sendResponse';
import type { LoggerService } from '@src/lib/logger-service';
import type { MiddlewareFactory } from '@src/lib/lucky-server';
import type { WebSocket } from 'ws';

export class ValidateActionMiddleware implements MiddlewareFactory {
  constructor(private readonly logger: LoggerService) {}

  use() {
    return async (socket: WebSocket, payload: unknown, next: () => void) => {
      const validatedData = this.validateMessageData(payload);

      if (!validatedData) {
        this.logger.debug('Send action: invalid message data', { payload });
        sendResponse({ socket, type: ResponseTypes.ValidationError, message: 'data must be an object' });
        return;
      }

      next();
    };
  }

  private validateMessageData(data: unknown): Record<string, unknown> | null {
    if (data === null || typeof data !== 'object') return null;

    return data as Record<string, unknown>;
  }
}
