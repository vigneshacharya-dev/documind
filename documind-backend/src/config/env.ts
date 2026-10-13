import 'dotenv/config';
import { z } from 'zod';

/**
 * The single source of truth for configuration.
 *
 * Rules:
 *  1. process.env is read ONLY in this file. Everything else imports `env`.
 *  2. Invalid config = the process refuses to start (fail fast).
 *  3. This file must NOT import the logger: the logger needs env to be
 *     built, so importing it here would create a circular dependency.
 *     That is why failures are reported with console.error.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // process.env values are always strings, so we check the string first
  // (clear "missing" message), then convert "3000" -> 3000 and range-check it.
  PORT: z
    .string({ error: 'is required (e.g. PORT=3000)' })
    .transform(Number)
    .pipe(
      z
        .number({ error: 'must be a number' })
        .int('must be a whole number')
        .min(1, 'must be between 1 and 65535')
        .max(65535, 'must be between 1 and 65535'),
    ),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    console.error(`\nInvalid environment configuration:\n${problems}\n`);
    console.error('Copy .env.example to .env and fill in the missing values.\n');
    process.exit(1);
  }

  return Object.freeze(result.data);
}

export const env: Env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
