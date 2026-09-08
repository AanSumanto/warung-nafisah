'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchPublicMemberRewards } from './api';
import { formatPointsDelta, formatPortalDate, memberGreeting } from './format';
import type { PublicMemberRewards, PublicPortalFetchResult } from './types';

interface MemberPortalViewProps {
  readonly token: string;
}

function LoadingState() {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 8 }} aria-busy="true" aria-live="polite">
      <CircularProgress size={36} />
      <Typography color="text.secondary">Memuat Nafisah Rewards…</Typography>
    </Stack>
  );
}

function ErrorState({
  title,
  detail,
  onRetry,
}: {
  readonly title: string;
  readonly detail: string;
  readonly onRetry?: () => void;
}) {
  return (
    <Stack spacing={2} sx={{ py: 4 }} role="alert">
      <Typography variant="h6" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary">{detail}</Typography>
      {onRetry ? (
        <Button variant="contained" onClick={onRetry} sx={{ alignSelf: 'flex-start' }}>
          Coba lagi
        </Button>
      ) : null}
    </Stack>
  );
}

function RewardSection({ data }: { readonly data: PublicMemberRewards }) {
  const rewards = data.rewards ?? [];
  const eligible = rewards.filter((r) => r.eligible);
  const upcoming = rewards.filter((r) => !r.eligible);

  return (
    <Stack spacing={3}>
      {eligible.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1.5, letterSpacing: 0.4 }}>
            REWARD YANG BISA DIGUNAKAN
          </Typography>
          <Stack spacing={1.5}>
            {eligible.map((reward) => (
              <Box
                key={reward.rewardCode}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography fontWeight={700}>{reward.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {reward.pointsRequired} poin
                </Typography>
                {reward.availability === 'TEMPORARILY_UNAVAILABLE' ? (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                    Sedang tidak tersedia
                  </Typography>
                ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Tunjukkan reward ini kepada kasir untuk ditukar.
                </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      {upcoming.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1.5, letterSpacing: 0.4 }}>
            REWARD BERIKUTNYA
          </Typography>
          <Stack spacing={1.5}>
            {upcoming.map((reward) => (
              <Box
                key={reward.rewardCode}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography fontWeight={700}>{reward.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {reward.pointsRequired} poin
                </Typography>
                {reward.availability === 'TEMPORARILY_UNAVAILABLE' ? (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                    Sedang tidak tersedia
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Kurang {reward.pointsRemaining ?? 0} poin
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}

function ActivePortal({ data }: { readonly data: PublicMemberRewards }) {
  const points = data.points?.current ?? 0;
  const next = data.progress?.nextReward;
  const progressPct = next
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(((next.pointsRequired - next.pointsRemaining) / next.pointsRequired) * 100),
        ),
      )
    : data.progress?.hasRedeemableReward
      ? 100
      : 0;

  return (
    <Stack spacing={3}>
      <Box textAlign="center">
        <Typography variant="overline" color="text.secondary">
          Warung Nafisah
        </Typography>
        <Typography variant="h5" component="h1" fontWeight={800} letterSpacing={1}>
          NAFISAH REWARDS
        </Typography>
        <Typography sx={{ mt: 1 }}>
          {memberGreeting(data.member?.displayName)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.member?.phoneMasked}
        </Typography>
      </Box>

      <Box textAlign="center" sx={{ py: 1 }}>
        <Typography
          component="p"
          sx={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'primary.main' }}
          aria-label={`${points} poin`}
        >
          {points}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
          POIN
        </Typography>
        {points < 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 2 }}>
            Poin akan bertambah kembali dari transaksi berikutnya.
          </Typography>
        ) : null}
      </Box>

      <Box>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {data.progress?.message}
        </Typography>
      </Box>

      {data.redemptionHint ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {data.redemptionHint}
        </Alert>
      ) : null}

      <RewardSection data={data} />

      {(data.recentActivity?.length ?? 0) > 0 ? (
        <Box>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1.5, letterSpacing: 0.4 }}>
            AKTIVITAS POIN
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={1.25}>
            {data.recentActivity!.map((item, index) => (
              <Box key={`${item.occurredAt}-${index}`}>
                <Typography fontWeight={700}>{formatPointsDelta(item.pointsDelta)}</Typography>
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPortalDate(item.occurredAt)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}

function UnavailablePortal({ data }: { readonly data: PublicMemberRewards }) {
  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Typography variant="h5" component="h1" fontWeight={800}>
        NAFISAH REWARDS
      </Typography>
      {data.member ? (
        <Typography>
          {memberGreeting(data.member.displayName)}
          <br />
          <Typography component="span" variant="body2" color="text.secondary">
            {data.member.phoneMasked}
          </Typography>
        </Typography>
      ) : null}
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        {data.message ?? 'Nafisah Rewards sedang belum tersedia.'}
      </Alert>
    </Stack>
  );
}

export function MemberPortalView({ token }: MemberPortalViewProps) {
  const [result, setResult] = useState<PublicPortalFetchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setResult(null);
    const next = await fetchPublicMemberRewards(token);
    setResult(next);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !result) return <LoadingState />;

  if (result.status === 'not_found') {
    return (
      <ErrorState
        title="Member Nafisah Rewards tidak ditemukan."
        detail="Silakan hubungi kasir Warung Nafisah jika membutuhkan bantuan."
      />
    );
  }

  if (result.status === 'rate_limited') {
    return (
      <ErrorState
        title="Terlalu banyak permintaan"
        detail="Coba lagi beberapa saat."
        onRetry={() => void load()}
      />
    );
  }

  if (result.status === 'network') {
    return (
      <ErrorState
        title="Data rewards belum dapat dimuat"
        detail="Coba lagi beberapa saat."
        onRetry={() => void load()}
      />
    );
  }

  if (result.data.programStatus === 'UNAVAILABLE') {
    return <UnavailablePortal data={result.data} />;
  }

  return <ActivePortal data={result.data} />;
}
