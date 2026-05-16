import type { EnvironmentValues } from '@src/common/constants';
import type { LoggerSettings } from '@src/lib/logger';

export type AuthCookieConfig = {
  /**
   * In milliseconds
   */
  maxAge: number;
};

type SingleCookie = {
  name: string;
  domain: string;
  maxAge: number;
};

export type CookiesConfig = {
  accessCookie: SingleCookie;
  refreshCookie: SingleCookie;
};

export type JwtConfig = {
  accessSecret: string;
  refreshSecret: string;
  accessExpireTime: string;
  refreshExpireTime: string;
  issuer: string;
};

export type LoggerServiceSettings = LoggerSettings & {
  serviceName?: string;
  logEnvironment?: EnvironmentValues;
};

export type PostgresConfig = {
  connectionString: string;
};
