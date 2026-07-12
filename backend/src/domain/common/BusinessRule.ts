import type { DomainError } from '../errors/DomainError.js';
import { DomainError as DomainErrorClass } from '../errors/DomainError.js';

export interface BusinessRule {
  readonly message: string;
  isBroken(): boolean;
}

export function checkRule(rule: BusinessRule): void {
  if (rule.isBroken()) {
    throw rule;
  }
}

export abstract class BusinessRuleViolation extends Error implements BusinessRule {
  abstract readonly message: string;
  abstract isBroken(): boolean;
}

export class CompositeBusinessRule implements BusinessRule {
  readonly message: string;

  constructor(
    private readonly rules: BusinessRule[],
    message = 'One or more business rules were violated',
  ) {
    this.message = message;
  }

  isBroken(): boolean {
    return this.rules.some((r) => r.isBroken());
  }

  brokenRules(): BusinessRule[] {
    return this.rules.filter((r) => r.isBroken());
  }
}

export function evaluateBusinessRule(rule: BusinessRule): DomainError | null {
  if (rule.isBroken()) {
    return DomainErrorClass.businessRule(rule.message);
  }
  return null;
}
