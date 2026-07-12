import { DomainError, type DomainErrorCode } from './DomainError.js';

export class DomainException extends Error {
  readonly domainError: DomainError;

  constructor(domainError: DomainError) {
    super(domainError.message);
    this.name = 'DomainException';
    this.domainError = domainError;
    Error.captureStackTrace(this, this.constructor);
  }

  get code(): DomainErrorCode {
    return this.domainError.code;
  }

  static fromMessage(
    code: DomainErrorCode,
    message: string,
    metadata?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(new DomainError({ code, message, metadata }));
  }
}
