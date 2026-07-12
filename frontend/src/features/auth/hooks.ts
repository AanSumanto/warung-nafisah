'use client';

import { useMutation } from '@tanstack/react-query';
import { loginApi, persistSession } from './api';
import type { LoginRequest } from './types';

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const result = await loginApi(credentials);
      persistSession(result.token, result.user);
      return result;
    },
  });
}
