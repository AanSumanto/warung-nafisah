import { DomainError } from '../errors/DomainError.js';

/** Validates Rupiah amounts stored as non-negative integers (no floats). */
export function assertIntegerRupiah(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw DomainError.invalidArgument(`${field} must be a finite number`, field);
  }
  if (!Number.isInteger(value)) {
    throw DomainError.invalidArgument(`${field} must be an integer (Rupiah)`, field);
  }
  if (value < 0) {
    throw DomainError.invalidArgument(`${field} cannot be negative`, field);
  }
}

export function multiplyIntegerRupiah(unitPrice: number, qty: number): number {
  assertIntegerRupiah(unitPrice, 'hargaJual');
  if (!Number.isInteger(qty) || qty < 1) {
    throw DomainError.invalidArgument('qty must be a positive integer', 'qty');
  }
  return unitPrice * qty;
}
