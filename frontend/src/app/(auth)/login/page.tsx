'use client';

import TextField from '@mui/material/TextField';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { z } from 'zod';
import { AppButton, AppCard, AppForm } from '@/shared/components/ui';
import { useSnackbar } from '@/shared/hooks';
import { getClientEnv } from '@/shared/lib/env';
import { getSafeRedirectPath } from '@/shared/lib/safe-redirect';
import { useAuth } from '@/shared/providers';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { login, isAuthenticated, isLoading } = useAuth();
  const appName = getClientEnv().NEXT_PUBLIC_APP_NAME;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getSafeRedirectPath(searchParams.get('redirect')));
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      router.replace(getSafeRedirectPath(searchParams.get('redirect')));
    } catch {
      enqueueSnackbar('Email atau password salah', { variant: 'error' });
    }
  };

  return (
    <AppCard
      sx={{ width: '100%', maxWidth: 420 }}
      header={{
        title: appName,
        subheader: 'Masuk ke sistem POS',
      }}
      contentProps={{ sx: { display: 'flex', flexDirection: 'column', gap: 2 } }}
    >
      <AppForm<LoginFormValues>
        schema={loginSchema}
        defaultValues={{ email: '', password: '' }}
        onSubmit={handleSubmit}
      >
        {(methods) => (
          <>
            <TextField
              fullWidth
              label="Email"
              type="email"
              autoComplete="username"
              error={Boolean(methods.formState.errors.email)}
              helperText={methods.formState.errors.email?.message}
              {...methods.register('email')}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(methods.formState.errors.password)}
              helperText={methods.formState.errors.password?.message}
              {...methods.register('password')}
            />
            <AppButton
              type="submit"
              variant="contained"
              fullWidth
              loading={methods.formState.isSubmitting}
              sx={{ minHeight: 48, mt: 1 }}
            >
              Masuk
            </AppButton>
          </>
        )}
      </AppForm>
    </AppCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
