import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/features/auth/constants';
import { getClientEnv } from '../env';

export interface ApiErrorBody {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly requestId?: string;
    readonly timestamp?: string;
  };
}

export function createApiClient() {
  const env = getClientEnv();

  return axios.create({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL
      ? `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
      : '/api/v1',
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

export const apiClient = createApiClient();

export function attachRequestInterceptor(
  onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
): number {
  return apiClient.interceptors.request.use(async (config) => {
    const correlationId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `req-${Date.now()}`;

    config.headers.set('X-Correlation-Id', correlationId);

    const token = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return onRequest ? await onRequest(config) : config;
  });
}

export function attachResponseInterceptor(): number {
  return apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );
}

let interceptorsAttached = false;

export function ensureApiInterceptors(): void {
  if (interceptorsAttached) return;
  attachRequestInterceptor();
  attachResponseInterceptor();
  interceptorsAttached = true;
}
