import type { CorsOptions } from 'cors';
import { getCorsOrigins } from './env.js';
import { isCorsOriginAllowed } from './cors-origins.js';
import { logger } from './logger.js';

let corsStartupLogged = false;

function logCorsStartup(origins: string[]): void {
  if (corsStartupLogged) return;
  corsStartupLogged = true;

  logger.info(
    {
      originCount: origins.length,
      origins: origins.map((origin) => new URL(origin).host),
    },
    'CORS allowlist loaded',
  );
}

export function getCorsConfig(): CorsOptions {
  const allowedOrigins = getCorsOrigins();
  logCorsStartup(allowedOrigins);

  return {
    origin(origin, callback) {
      // Server-to-server, curl, Postman — no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isCorsOriginAllowed(origin, allowedOrigins)) {
        callback(null, origin);
        return;
      }

      // Never pass Error to callback — that produces HTTP 500 in cors package.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Correlation-Id',
      'X-API-Version',
    ],
    optionsSuccessStatus: 204,
  };
}

export function resetCorsStartupLog(): void {
  corsStartupLogged = false;
}
