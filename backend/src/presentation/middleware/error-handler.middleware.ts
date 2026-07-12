import type { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../core/exceptions/BaseException.js';
import { ResponseWrapper } from '../../core/http/ResponseWrapper.js';
import { logger } from '../../config/logger.js';

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof BaseException) {
    ResponseWrapper.error(res, err.code, err.message, err.httpStatus, err.details);
    return;
  }

  if (err instanceof Error && err.name === 'ZodError') {
    ResponseWrapper.error(res, 'SYS_001', 'Validasi gagal', 400);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  ResponseWrapper.error(res, 'SYS_500', 'Terjadi kesalahan internal', 500);
}
