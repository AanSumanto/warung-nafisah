'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import { AppButton } from '@/shared/components/ui';
import { apiClient } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';
import type { CashierRewardOption, OrderRewardsResponse } from '../loyaltyTypes';

interface RewardSectionProps {
  readonly enabled: boolean;
  readonly customerId: string | null;
  readonly selectedRewardCode: string | null;
  readonly onSelect: (rewardCode: string | null) => void;
}

async function fetchMemberRewards(customerId: string): Promise<OrderRewardsResponse> {
  const response = await apiClient.get<ApiSuccessResponse<OrderRewardsResponse>>(
    `/loyalty/member-rewards/${customerId}`,
  );
  return response.data.data;
}

export function RewardSection({
  enabled,
  customerId,
  selectedRewardCode,
  onSelect,
}: RewardSectionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderRewardsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!enabled || !customerId) return null;

  const openPicker = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMemberRewards(customerId);
      setData(next);
    } catch {
      setError('Gagal memuat daftar reward');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const selectReward = (reward: CashierRewardOption) => {
    if (!reward.eligible || reward.availability !== 'AVAILABLE') return;
    onSelect(reward.rewardCode);
    setOpen(false);
  };

  return (
    <Box
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        NAFISAH REWARDS
      </Typography>
      {data || selectedRewardCode ? (
        <Typography variant="body2">
          {selectedRewardCode
            ? `Reward dipilih: ${selectedRewardCode}`
            : `Poin saat ini: ${data?.currentPoints ?? '—'}`}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Belum pilih reward
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <AppButton size="small" onClick={() => void openPicker()}>
          Gunakan Reward
        </AppButton>
        {selectedRewardCode ? (
          <AppButton size="small" variant="text" onClick={() => onSelect(null)}>
            Hapus
          </AppButton>
        ) : null}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Pilih Reward</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Poin saat ini: {data?.currentPoints ?? 0}
              </Typography>
              <List dense>
                {(data?.rewards ?? []).map((reward) => {
                  const disabled =
                    !reward.eligible || reward.availability !== 'AVAILABLE';
                  const secondary =
                    reward.availability === 'TEMPORARILY_UNAVAILABLE'
                      ? 'Sedang tidak tersedia'
                      : reward.eligible
                        ? 'Bisa digunakan'
                        : `Kurang ${reward.pointsRemaining ?? 0} poin`;
                  return (
                    <ListItemButton
                      key={reward.rewardCode}
                      disabled={disabled}
                      selected={reward.rewardCode === selectedRewardCode}
                      onClick={() => selectReward(reward)}
                    >
                      <ListItemText
                        primary={`${reward.name} · ${reward.pointsRequired} poin`}
                        secondary={secondary}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
