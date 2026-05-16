import { Environment } from '@src/common/constants';
import { LogLevel, type LogLevelValues } from '@src/lib/logger';
import type { Config } from './constants';

export function configuration(): Config {
  return {
    port: (process.env.PORT || 8000) as number,
    isDev: !!process.env.IS_DEV,
    isCI: !!process.env.IS_CI,
    authCookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    jwt: {
      accessSecret: '1234',
      accessExpireTime: '1h',
      refreshSecret: '1234',
      refreshExpireTime: '1d',
      issuer: 'luckylove',
    },
    cookies: {
      accessCookie: {
        name: 'access_token',
        domain: process.env.DOMAIN || 'localhost',
        maxAge: 60 * 60 * 1000, // 1 hour
      },
      refreshCookie: {
        name: 'refresh_token',
        domain: process.env.DOMAIN || 'localhost',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    },
    logSettings: {
      serviceName: 'my-nest-like-server',
      logLevel: (process.env.LOG_LEVEL || LogLevel.Debug) as LogLevelValues,
      logEnvironment: Environment.Dev,
      useColoredOutput: process.env.NODE_ENV !== 'production',
    },
    postgres: {
      connectionString: process.env.POSTGRES_CONNECTION_STRING || 'postgres://user:password@localhost:5432/mydb',
    },
    redis: {
      connectionString: process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379',
    },
  };
}
