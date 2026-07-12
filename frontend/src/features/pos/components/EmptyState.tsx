'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  readonly emoji?: string;
  readonly title: string;
  readonly description?: string;
}

export function EmptyState({ emoji = '📋', title, description }: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography component="span" sx={{ fontSize: '3rem', lineHeight: 1, opacity: 0.9 }}>
        {emoji}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
