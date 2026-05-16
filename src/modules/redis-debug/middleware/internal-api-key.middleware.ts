import { Headers } from '@src/common/constants';
import { UnauthorizedError } from '@src/core/errors';
import type { Request, Response, NextFunction } from 'express';

const internalDebugApiKey = process.env.INTERNAL_DEBUG_API_KEY;

export function internalApiKeyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const providedKey = req.headers[Headers.InternalApiKey];

  if (internalDebugApiKey && providedKey === internalDebugApiKey) return next();

  throw new UnauthorizedError('Invalid or missing internal API key');
}
