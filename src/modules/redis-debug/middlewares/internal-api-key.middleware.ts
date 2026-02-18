import { Headers } from '@src/common/constants';
import { UnauthorizedError } from '@src/lib/Errors';
import type { Request, Response, NextFunction } from 'express';

const INTERNAL_DEBUG_API_KEY = process.env.INTERNAL_DEBUG_API_KEY;

export function internalApiKeyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const providedKey = req.headers[Headers.InternalApiKey];

  if (providedKey === INTERNAL_DEBUG_API_KEY) return next();

  throw new UnauthorizedError('Invalid or missing internal API key');
}
