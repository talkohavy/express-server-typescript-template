import type { OptimizedApp, UserToken } from './common/types';

declare module 'express' {
  export interface Request {
    user?: UserToken;
    query: any;
    /**
     * Only exists after applying the `joiQueryMiddleware`.
     */
    queryParsed?: any;
    userPermissions?: string[];
  }

  export interface Application extends OptimizedApp {
    no_keys: never;
  }
}

declare module 'ws' {
  export interface WebSocket {
    id: string;
  }
}
