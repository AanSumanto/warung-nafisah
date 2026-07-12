import type { CorsOptions } from 'cors';
import { getCorsOrigins } from './env.js';

export function getCorsConfig(): CorsOptions {
  const origins = getCorsOrigins();
  return {
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Correlation-Id',
      'X-API-Version',
    ],
  };
}
