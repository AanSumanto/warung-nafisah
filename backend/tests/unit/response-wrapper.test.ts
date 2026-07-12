import { describe, it, expect } from 'vitest';
import type { Response } from 'express';
import { runWithContext } from '../../src/core/context/async-context.js';
import { ResponseWrapper } from '../../src/core/http/ResponseWrapper.js';

function mockResponse(): Response {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader: () => res,
  };
  return res as unknown as Response;
}

describe('ResponseWrapper', () => {
  it('wraps success responses with meta', () => {
    const res = mockResponse();
    runWithContext(
      {
        requestId: 'req_test',
        correlationId: 'corr_test',
        startedAt: new Date(),
      },
      () => {
        ResponseWrapper.success(res, { ok: true });
      },
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { ok: true },
      meta: { requestId: 'req_test' },
    });
  });

  it('wraps error responses with code', () => {
    const res = mockResponse();
    runWithContext(
      {
        requestId: 'req_err',
        correlationId: 'corr_err',
        startedAt: new Date(),
      },
      () => {
        ResponseWrapper.error(res, 'SYS_001', 'Validasi gagal', 400);
      },
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Validasi gagal',
        requestId: 'req_err',
      },
    });
  });
});
