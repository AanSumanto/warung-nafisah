import type { Response } from 'express';
import { getRequestId } from '../context/async-context.js';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export class ResponseWrapper {
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    const body: ApiSuccessResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: getRequestId() ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.setHeader('X-API-Version', '1');
    return res.status(statusCode).json(body);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ): Response {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        requestId: getRequestId() ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.setHeader('X-API-Version', '1');
    return res.status(httpStatus).json(body);
  }
}
