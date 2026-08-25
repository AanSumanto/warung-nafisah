/**
 * Mongo lean() may return `_id` as ObjectId even when the schema uses String.
 * Domain mappers always need a plain string identifier.
 */
export function normalizeMongoId(value: unknown): string {
  if (value == null) {
    throw new Error('Document id is missing');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('Document id is empty');
    }
    return trimmed;
  }

  if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    const asString = value.toString().trim();
    if (!asString || asString === '[object Object]') {
      throw new Error('Document id is invalid');
    }
    return asString;
  }

  const asString = String(value).trim();
  if (!asString) {
    throw new Error('Document id is invalid');
  }
  return asString;
}
