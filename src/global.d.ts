import type { OptimizedApp, UserToken } from './common/types';

declare module 'express' {
  export interface Request {
    user?: UserToken;
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
