import pino from 'pino';
import { getEnv } from './env.js';

export const logger = pino({
  level: getEnv().LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'password',
      'passwordHash',
      'body.password',
    ],
    censor: '[REDACTED]',
  },
  transport:
    getEnv().NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});

export type Logger = typeof logger;
