import type { EnvironmentValues } from '@src/common/constants';
import type { RedisConfig } from '@src/lib/database/redis';
import type { LoggerSettings } from '@src/lib/logger';

export const ConfigKeys = {
  Port: 'port',
  IsDev: 'isDev',
  IsCI: 'isCI',
  AuthCookie: 'authCookie',
  Cookies: 'cookies',
  Jwt: 'jwt',
  LogSettings: 'logSettings',
  Postgres: 'postgres',
  Redis: 'redis',
  Services: 'services',
} as const;

type TypeOfConfigKeys = typeof ConfigKeys;
export type ConfigKeyValues = TypeOfConfigKeys[keyof TypeOfConfigKeys];

export type Config = {
  [ConfigKeys.Port]: number;
  [ConfigKeys.IsDev]: boolean;
  [ConfigKeys.IsCI]: boolean;
  [ConfigKeys.AuthCookie]: AuthCookieConfig;
  [ConfigKeys.Cookies]: CookiesConfig;
  [ConfigKeys.Jwt]: JwtConfig;
  [ConfigKeys.LogSettings]: LoggerServiceSettings;
  [ConfigKeys.Postgres]: PostgresConfig;
  [ConfigKeys.Redis]: Partial<RedisConfig>;
};

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

export const ServiceNames = {
  Auth: 'auth',
  Users: 'users',
  Books: 'books',
  Dragons: 'dragons',
  FileUpload: 'file-upload',
} as const;

export type ServiceNameKeys = keyof typeof ServiceNames;
export type ServiceNameValues = (typeof ServiceNames)[ServiceNameKeys];

export type ServicesConfig = Record<ServiceNameValues, { baseUrl: string }>;
