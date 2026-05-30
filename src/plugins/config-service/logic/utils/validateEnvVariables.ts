import { envSchema } from '../env-validation-schema';
import type { ValidEnv } from '../../types';

export function validateEnvVariables(): ValidEnv {
  const { error, value } = envSchema.validate(process.env, { abortEarly: false });

  if (error) {
    const messages = error.details
      .map((detail) => {
        const provided = detail.context?.value;
        const receivedStr = provided ? ` (received: "${provided}")` : '';
        return `  • ${detail.message}${receivedStr}`;
      })
      .join('\n');

    throw new Error(`\nEnvironment variable validation failed:\n${messages}\n`);
  }

  return value;
}
