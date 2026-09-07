import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import { MemberPortalView } from '@/features/rewards-portal/MemberPortalView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nafisah Rewards',
  description: 'Cek poin dan reward Warung Nafisah',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

interface PageProps {
  readonly params: Promise<{ token: string }>;
}

export default async function MemberRewardsPortalPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
        py: 3,
        maxWidth: 480,
        mx: 'auto',
      }}
    >
      <MemberPortalView token={token} />
    </Box>
  );
}
