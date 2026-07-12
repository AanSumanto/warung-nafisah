'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  persistSession,
  readStoredToken,
  readStoredUser,
  type AuthUser,
  type LoginRequest,
} from '@/features/auth';
import { loginApi } from '@/features/auth/api';

export type { AuthUser } from '@/features/auth';

export interface AuthContextValue {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly user: AuthUser | null;
  readonly login: (credentials: LoginRequest) => Promise<void>;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = readStoredToken();
    const storedUser = readStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    } else {
      clearSession();
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await loginApi(credentials);
    persistSession(result.token, result.user);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isLoading,
      user,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
