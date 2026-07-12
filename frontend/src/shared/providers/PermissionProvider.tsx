'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthProvider';

export interface PermissionContextValue {
  readonly can: (permission: string) => boolean;
  readonly hasRole: (role: string) => boolean;
  readonly permissions: readonly string[];
  readonly roles: readonly string[];
}

const defaultValue: PermissionContextValue = {
  can: () => false,
  hasRole: () => false,
  permissions: [],
  roles: [],
};

const PermissionContext = createContext<PermissionContextValue>(defaultValue);

interface PermissionProviderProps {
  readonly children: React.ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user } = useAuth();

  const roles = useMemo<readonly string[]>(() => (user ? [user.role] : []), [user]);

  const hasRole = useCallback(
    (role: string) => roles.some((current) => current === role),
    [roles],
  );

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (permission.startsWith('owner:')) return user.role === 'owner';
      return true;
    },
    [user],
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      can,
      hasRole,
      permissions: [],
      roles,
    }),
    [can, hasRole, roles],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission(): PermissionContextValue {
  return useContext(PermissionContext);
}
