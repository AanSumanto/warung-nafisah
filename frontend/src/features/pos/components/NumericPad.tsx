'use client';

import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { formatIdrPlain } from '../constants';

interface NumericPadProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

export function NumericPad({ value, onChange, label }: NumericPadProps) {
  const display = value ? formatIdrPlain(Number(value)) : '0';

  const handleKey = (key: (typeof KEYS)[number]) => {
    if (key === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    const next = `${value}${key}`.replace(/^0+(?=\d)/, '');
    if (next.length > 12) return;
    onChange(next);
  };

  return (
    <Box>
      {label ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}
      <Box
        sx={{
          p: 2,
          mb: 1.5,
          borderRadius: 2,
          bgcolor: 'grey.50',
          textAlign: 'right',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {display}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
        }}
      >
        {KEYS.map((key) => (
          <Button
            key={key}
            variant="outlined"
            color="inherit"
            onClick={() => handleKey(key)}
            sx={{
              minHeight: 52,
              fontSize: key === 'back' ? '1rem' : '1.25rem',
              fontWeight: 700,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {key === 'back' ? <BackspaceOutlinedIcon /> : key}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
