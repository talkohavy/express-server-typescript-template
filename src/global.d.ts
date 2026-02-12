import type { OptimizedApp } from './common/types';

declare module 'express' {
  export interface Request {
    user?: Record<string, any>;
    query: any;
    /**
     * Only exists after applying the `joiQueryMiddleware`.
     */
    queryParsed?: any;
  }

  export interface Application extends OptimizedApp {
    no_keys: never;
  }
}
