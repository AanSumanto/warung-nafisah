export class BaseException extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('SYS_001', message, 400, details);
  }
}

export class NotFoundException extends BaseException {
  constructor(message = 'Resource tidak ditemukan', details?: Record<string, unknown>) {
    super('SYS_002', message, 404, details);
  }
}

export class InfrastructureException extends BaseException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('SYS_500', message, 503, details);
  }
}
