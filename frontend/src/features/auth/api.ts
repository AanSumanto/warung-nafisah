import { apiClient } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './constants';
import type { AuthUser, LoginRequest, LoginResponse } from './types';

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', credentials);
  return response.data.data;
}

export function persistSession(token: string, user: AuthUser): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

export function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
