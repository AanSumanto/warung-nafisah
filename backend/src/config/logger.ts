import pino from 'pino';
import { getEnv } from './env.js';

export const logger = pino({
  level: getEnv().LOG_LEVEL,
  transport:
    getEnv().NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});

export type Logger = typeof logger;
