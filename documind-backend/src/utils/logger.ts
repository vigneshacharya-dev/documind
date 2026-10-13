import pino from 'pino';
import { env, isProduction } from '../config/env';

/**
 * Structured logging: every log line is a JSON object, not a sentence.
 * JSON logs can be searched and filtered by field in CloudWatch later
 * (e.g. "show me all errors for requestId X").
 *
 * In development we pipe through pino-pretty for human-readable output.
 * In production we emit raw JSON (pretty-printing is slow and unparseable).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'documind-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never let credentials leak into logs.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]',
  },
  ...(isProduction
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }),
});
