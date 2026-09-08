import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandlerMiddleware } from '../../../src/presentation/middleware/error-handler.middleware.js';
import { ConflictException } from '../../../src/core/exceptions/BaseException.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: null as unknown,
    setHeader() {
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('errorHandlerMiddleware concurrency mapping', () => {
  it('maps WriteConflict to HTTP 409 without leaking Mongo details', () => {
    const res = mockRes();
    errorHandlerMiddleware(
      new Error('WriteConflict during multi-document transaction'),
      {} as Request,
      res,
      (() => undefined) as NextFunction,
    );
    expect(res.statusCode).toBe(409);
    const body = res.body as { success: boolean; error: { code: string; message: string } };
    expect(body.error.code).toBe('POS_TRANSACTION_CONFLICT');
    expect(body.error.message).not.toMatch(/WriteConflict|mongo|E11000/i);
  });

  it('maps DomainError to HTTP 400', () => {
    const res = mockRes();
    errorHandlerMiddleware(
      DomainError.businessRule('Poin tidak mencukupi'),
      {} as Request,
      res,
      (() => undefined) as NextFunction,
    );
    expect(res.statusCode).toBe(400);
  });

  it('passes ConflictException through as 409', () => {
    const res = mockRes();
    errorHandlerMiddleware(
      new ConflictException('Transaksi sedang diproses. Silakan coba lagi.', {
        code: 'POS_TRANSACTION_CONFLICT',
      }),
      {} as Request,
      res,
      (() => undefined) as NextFunction,
    );
    expect(res.statusCode).toBe(409);
  });
});
