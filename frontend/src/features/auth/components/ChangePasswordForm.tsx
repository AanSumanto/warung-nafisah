'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { z } from 'zod';
import { useChangePassword } from '@/features/auth/hooks';
import { AppButton, AppForm } from '@/shared/components/ui';
import { useSnackbar } from '@/shared/hooks';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Password baru harus berbeda dari password saat ini',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { enqueueSnackbar } = useSnackbar();
  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (
    values: ChangePasswordFormValues,
    methods: { reset: () => void },
  ) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      methods.reset();
      enqueueSnackbar('Password berhasil diubah', { variant: 'success' });
    } catch {
      enqueueSnackbar('Gagal mengubah password. Periksa password saat ini.', { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LockOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={700}>
          Ganti Password
        </Typography>
      </Box>

      <AppForm<ChangePasswordFormValues>
        schema={changePasswordSchema}
        defaultValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
        onSubmit={handleSubmit}
      >
        {(methods) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Password saat ini"
              type="password"
              autoComplete="current-password"
              error={Boolean(methods.formState.errors.currentPassword)}
              helperText={methods.formState.errors.currentPassword?.message}
              {...methods.register('currentPassword')}
            />
            <TextField
              fullWidth
              label="Password baru"
              type="password"
              autoComplete="new-password"
              error={Boolean(methods.formState.errors.newPassword)}
              helperText={methods.formState.errors.newPassword?.message ?? 'Minimal 8 karakter'}
              {...methods.register('newPassword')}
            />
            <TextField
              fullWidth
              label="Konfirmasi password baru"
              type="password"
              autoComplete="new-password"
              error={Boolean(methods.formState.errors.confirmPassword)}
              helperText={methods.formState.errors.confirmPassword?.message}
              {...methods.register('confirmPassword')}
            />
            <AppButton
              type="submit"
              variant="contained"
              fullWidth
              loading={methods.formState.isSubmitting || changePasswordMutation.isPending}
              sx={{ minHeight: 48, fontWeight: 700 }}
            >
              Simpan Password
            </AppButton>
          </Box>
        )}
      </AppForm>
    </Box>
  );
}
