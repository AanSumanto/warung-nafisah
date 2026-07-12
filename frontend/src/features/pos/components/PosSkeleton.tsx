'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export function MenuGridSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 1,
        '& > *': { minWidth: 0, maxWidth: '100%' },
      }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={72}
          sx={{ borderRadius: 2.5, width: '100%' }}
        />
      ))}
    </Box>
  );
}

export function HistoryTableSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={56} />
      ))}
    </Box>
  );
}

export function DashboardSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={100} />
      ))}
    </Box>
  );
}
