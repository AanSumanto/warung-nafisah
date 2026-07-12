import type { NextFunction, Request, Response } from 'express';
import { getCorsOrigins } from '../../config/env.js';
import { isCorsOriginAllowed } from '../../config/cors-origins.js';
import { logger } from '../../config/logger.js';
import { ResponseWrapper } from '../../core/http/ResponseWrapper.js';

export function createCorsOriginGuard() {
  const allowedOrigins = getCorsOrigins();

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (!origin) {
      next();
      return;
    }

    if (isCorsOriginAllowed(origin, allowedOrigins)) {
      next();
      return;
    }

    let originHost = 'invalid-origin';
    try {
      originHost = new URL(origin).host;
    } catch {
      // keep generic host label for malformed Origin values
    }

    logger.warn(
      {
        event: 'cors_rejected',
        originHost,
        method: req.method,
        path: req.path,
      },
      'CORS origin not allowed',
    );

    ResponseWrapper.error(res, 'CORS_001', 'Origin tidak diizinkan', 403);
  };
}
