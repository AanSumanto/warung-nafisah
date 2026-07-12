/**
 * Branded identifier type for domain entities.
 */
export type Identifier<T extends string = string> = string & { readonly __brand: T };

export function createIdentifier<T extends string = string>(value: string): Identifier<T> {
  if (!value || value.trim().length === 0) {
    throw new Error('Identifier value cannot be empty');
  }
  return value as Identifier<T>;
}

export function isIdentifier(value: unknown): value is Identifier {
  return typeof value === 'string' && value.length > 0;
}
