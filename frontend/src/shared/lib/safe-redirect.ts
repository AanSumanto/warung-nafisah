const DEFAULT_REDIRECT = '/pos';

export function getSafeRedirectPath(value: string | null, fallback = DEFAULT_REDIRECT): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('://')) return fallback;
  return value;
}
