import type { PublicMemberRewards, PublicPortalFetchResult } from './types';

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '';
  if (base) return `${base.replace(/\/+$/, '')}/api/v1`;
  return '/api/v1';
}

/**
 * Public portal fetch — no auth header, no-store.
 * Does not use apiClient (avoids 401 → login redirect).
 * Token is never logged.
 */
export async function fetchPublicMemberRewards(
  token: string,
): Promise<PublicPortalFetchResult> {
  try {
    const response = await fetch(
      `${apiBase()}/public/rewards/member/${encodeURIComponent(token)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );

    if (response.status === 404) return { status: 'not_found' };
    if (response.status === 429) return { status: 'rate_limited' };
    if (!response.ok) return { status: 'network' };

    const body = (await response.json()) as {
      success?: boolean;
      data?: PublicMemberRewards;
    };
    if (!body.success || !body.data) return { status: 'network' };
    return { status: 'ok', data: body.data };
  } catch {
    return { status: 'network' };
  }
}
