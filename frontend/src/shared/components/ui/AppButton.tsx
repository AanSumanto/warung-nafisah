import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export interface AppButtonProps extends ButtonProps {
  readonly loading?: boolean;
}

export function AppButton({ loading = false, disabled, children, startIcon, ...props }: AppButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...props}
    >
      {children}
    </Button>
  );
}
