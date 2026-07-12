import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { RequestContext } from '../../core/context/RequestContext.js';
import { runWithContext } from '../../core/context/async-context.js';

const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = headerValue(req.headers[REQUEST_ID_HEADER]) ?? `req_${uuidv4()}`;
  const correlationId =
    headerValue(req.headers[CORRELATION_ID_HEADER]) ?? headerValue(req.headers[REQUEST_ID_HEADER]) ?? `corr_${uuidv4()}`;

  const context: RequestContext = {
    requestId,
    correlationId,
    startedAt: new Date(),
  };

  req.context = context;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Correlation-Id', correlationId);

  runWithContext(context, () => next());
}
