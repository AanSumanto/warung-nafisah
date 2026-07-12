export type DomainErrorCode =
  | 'DOMAIN_INVALID_ARGUMENT'
  | 'DOMAIN_BUSINESS_RULE_VIOLATION'
  | 'DOMAIN_INVARIANT_VIOLATION'
  | 'DOMAIN_NOT_FOUND'
  | 'DOMAIN_CONFLICT'
  | 'DOMAIN_UNSUPPORTED_OPERATION';

export interface DomainErrorDetails {
  code: DomainErrorCode;
  message: string;
  field?: string;
  metadata?: Record<string, unknown>;
}

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly field?: string;
  readonly metadata?: Record<string, unknown>;

  constructor(details: DomainErrorDetails) {
    super(details.message);
    this.name = 'DomainError';
    this.code = details.code;
    this.field = details.field;
    this.metadata = details.metadata;
    Error.captureStackTrace(this, this.constructor);
  }

  static invalidArgument(message: string, field?: string): DomainError {
    return new DomainError({ code: 'DOMAIN_INVALID_ARGUMENT', message, field });
  }

  static businessRule(message: string, metadata?: Record<string, unknown>): DomainError {
    return new DomainError({ code: 'DOMAIN_BUSINESS_RULE_VIOLATION', message, metadata });
  }

  static invariant(message: string, metadata?: Record<string, unknown>): DomainError {
    return new DomainError({ code: 'DOMAIN_INVARIANT_VIOLATION', message, metadata });
  }
}
