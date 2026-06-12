import Joi from 'joi';
import { LogLevel } from '@src/lib/logger';
import type { ValidEnv } from '../types';

const logLevelValues = Object.values(LogLevel);

export const envSchema = Joi.object<ValidEnv>({
  PORT: Joi.number().port().default(8000).messages({
    'number.base': '"PORT" must be a valid number',
    'number.port': '"PORT" must be a valid port (0-65535)',
  }),
  POSTGRES_CONNECTION_STRING: Joi.string().required(),
  REDIS_CONNECTION_STRING: Joi.string().required(),
  MICRO_SERVICES_PROTOCOL: Joi.string().valid('direct', 'http', 'grpc').required(),
  LOG_LEVEL: Joi.string()
    .valid(...logLevelValues)
    .default(LogLevel.Debug)
    .messages({
      'any.only': `"LOG_LEVEL" must be one of [${logLevelValues.join(', ')}]`,
    }),
  SHOULD_MIGRATE_POSTGRES: Joi.boolean().default(false),
  IS_DEV: Joi.boolean().default(false),
  IS_CI: Joi.boolean().default(false),
  DOMAIN: Joi.string().default('localhost'),
  NODE_ENV: Joi.string().optional(),
}).unknown(true);
