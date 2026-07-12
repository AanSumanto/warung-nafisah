'use client';

import { useEffect } from 'react';
import { ensureApiInterceptors } from '@/shared/lib/api';
import { AuthProvider } from './AuthProvider';
import { PermissionProvider } from './PermissionProvider';
import { QueryProvider } from './QueryProvider';
import { SnackbarProvider } from './SnackbarProvider';
import { ThemeRegistry } from './ThemeRegistry';

interface AppProvidersProps {
  readonly children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    ensureApiInterceptors();
  }, []);

  return (
    <ThemeRegistry>
      <QueryProvider>
        <SnackbarProvider>
          <AuthProvider>
            <PermissionProvider>{children}</PermissionProvider>
          </AuthProvider>
        </SnackbarProvider>
      </QueryProvider>
    </ThemeRegistry>
  );
}
