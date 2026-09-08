import type { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../core/exceptions/BaseException.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { ResponseWrapper } from '../../core/http/ResponseWrapper.js';
import { logger } from '../../config/logger.js';
import { isTransientTransactionError } from '../../infrastructure/database/transaction-retry.js';

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

  if (err instanceof DomainError) {
    ResponseWrapper.error(
      res,
      'SYS_001',
      err.message,
      400,
      err.field ? { field: err.field } : undefined,
    );
    return;
  }

  if (err instanceof Error && err.name === 'ZodError') {
    ResponseWrapper.error(res, 'SYS_001', 'Validasi gagal', 400);
    return;
  }

  // Expected concurrency losers after retry exhaustion — no raw Mongo leak.
  if (isTransientTransactionError(err)) {
    ResponseWrapper.error(
      res,
      'POS_TRANSACTION_CONFLICT',
      'Transaksi sedang diproses. Silakan coba lagi.',
      409,
    );
    return;
  }

  logger.error({ err }, 'Unhandled error');
  ResponseWrapper.error(res, 'SYS_500', 'Terjadi kesalahan internal', 500);
}
