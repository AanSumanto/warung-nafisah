'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AppButton } from '@/shared/components/ui';
import type { PosMemberSelection } from '../loyaltyTypes';

interface MemberSectionProps {
  readonly enabled: boolean;
  readonly member: PosMemberSelection | null;
  readonly onSearch: () => void;
  readonly onClear: () => void;
}

export function MemberSection({ enabled, member, onSearch, onClear }: MemberSectionProps) {
  if (!enabled) return null;

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
        Member Nafisah Rewards
      </Typography>
      {member ? (
        <>
          <Typography variant="body2">
            {member.name ?? 'Member'} — {member.phoneMasked}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AppButton size="small" variant="outlined" onClick={onSearch}>
              Ganti
            </AppButton>
            <AppButton size="small" variant="text" onClick={onClear}>
              Tanpa Member
            </AppButton>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            Belum pilih member
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AppButton size="small" onClick={onSearch}>
              Cari Member
            </AppButton>
            <AppButton size="small" variant="outlined" onClick={onClear}>
              Lewati
            </AppButton>
          </Box>
        </>
      )}
    </Box>
  );
}
