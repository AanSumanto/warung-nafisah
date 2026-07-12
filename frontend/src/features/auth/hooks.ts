'use client';

import { useMutation } from '@tanstack/react-query';
import { changePasswordApi, loginApi, persistSession } from './api';
import type { ChangePasswordRequest, LoginRequest } from './types';

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const result = await loginApi(credentials);
      persistSession(result.token, result.user);
      return result;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePasswordApi(body),
  });
}
