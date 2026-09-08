'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/shared/providers';
import { formatIdr } from '@/features/pos';
import {
  fetchAdminAdjustmentGate,
  fetchAdminMemberDetail,
  fetchAdminMemberLedger,
  fetchLoyaltyDashboard,
  newAdjustmentRequestId,
  postManualAdjustment,
  searchAdminMembers,
  verifyAdminMemberBalance,
  type AdminLedgerItem,
  type AdminMemberDetail,
  type AdminMemberHit,
  type LoyaltyDashboard,
} from '@/features/owner-loyalty/api';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function fmtPct(v: number | null): string {
  if (v === null || v === undefined) return 'Belum ada data';
  return `${v}%`;
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return String(v);
}

export default function OwnerLoyaltyPage() {
  const router = useRouter();
  const { hasRole } = usePermission();
  const [preset, setPreset] = useState('30d');
  const [dashboard, setDashboard] = useState<LoyaltyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentEnabled, setAdjustmentEnabled] = useState(false);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<AdminMemberHit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null);
  const [ledger, setLedger] = useState<AdminLedgerItem[]>([]);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [delta, setDelta] = useState('10');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRole('owner')) {
      router.replace('/pos');
    }
  }, [hasRole, router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, gate] = await Promise.all([
        fetchLoyaltyDashboard(preset),
        fetchAdminAdjustmentGate(),
      ]);
      setDashboard(dash);
      setAdjustmentEnabled(gate);
    } catch {
      setError('Gagal memuat dashboard loyalty');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const openMember = async (customerId: string) => {
    setSelectedId(customerId);
    setVerifyMsg(null);
    try {
      const [d, l] = await Promise.all([
        fetchAdminMemberDetail(customerId),
        fetchAdminMemberLedger(customerId),
      ]);
      setDetail(d);
      setLedger(l);
    } catch {
      setDetail(null);
      setLedger([]);
    }
  };

  const onSearch = async () => {
    if (query.trim().length < 2) return;
    try {
      setHits(await searchAdminMembers(query.trim()));
    } catch {
      setHits([]);
    }
  };

  const projected =
    detail && Number.isInteger(Number(delta))
      ? detail.currentPoints + Number(delta)
      : null;

  const submitAdjust = async () => {
    if (!detail || !selectedId) return;
    setAdjustBusy(true);
    setAdjustError(null);
    try {
      const result = await postManualAdjustment(selectedId, {
        pointsDelta: Number(delta),
        reason: reason.trim(),
        requestId: newAdjustmentRequestId(),
      });
      setConfirmOpen(false);
      setAdjustOpen(false);
      setReason('');
      await openMember(selectedId);
      await loadDashboard();
      setVerifyMsg(
        `Penyesuaian ${result.pointsDelta > 0 ? '+' : ''}${result.pointsDelta} → saldo ${result.balanceAfter}`,
      );
    } catch {
      setAdjustError('Gagal menyesuaikan poin');
    } finally {
      setAdjustBusy(false);
    }
  };

  if (!hasRole('owner')) return null;

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      <Box>
        <Typography variant="h5" fontWeight={800}>
          Nafisah Rewards
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analitik operasional & penyesuaian poin (owner)
        </Typography>
      </Box>

      <TextField
        select
        size="small"
        label="Periode"
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        sx={{ maxWidth: 220 }}
      >
        <MenuItem value="today">Hari ini</MenuItem>
        <MenuItem value="7d">7 hari</MenuItem>
        <MenuItem value="30d">30 hari</MenuItem>
        <MenuItem value="month">Bulan ini</MenuItem>
      </TextField>

      {loading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : dashboard ? (
        <>
          <Typography variant="subtitle2" fontWeight={700}>
            Ringkasan
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Member terdaftar" value={fmtNum(dashboard.members.totalRegistered)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Member aktif (periode)"
                value={fmtNum(dashboard.members.activeInRange)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Omset member"
                value={formatIdr(dashboard.sales.memberSalesAmount)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Outstanding poin (net)"
                value={fmtNum(dashboard.points.netOutstanding)}
                hint="Bukan valuasi Rp"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Positive outstanding"
                value={fmtNum(dashboard.points.positiveOutstanding)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Negative deficit"
                value={fmtNum(dashboard.points.negativeDeficit)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Biaya reward (HPP)"
                value={formatIdr(dashboard.cost.rewardHppCostInRange)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Loyalty cost %"
                value={fmtPct(dashboard.cost.loyaltyCostPercent)}
                hint="HPP ÷ eligible member sales"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700}>
            Earn / Redeem
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Poin earned" value={fmtNum(dashboard.points.earnedInRange)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Poin redeemed" value={fmtNum(dashboard.points.redeemedInRange)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Poin reversed" value={fmtNum(dashboard.points.reversedInRange)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                label="Redemption rate"
                value={fmtPct(dashboard.points.redemptionRatePoints)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Member AOV" value={dashboard.sales.memberAov != null ? formatIdr(dashboard.sales.memberAov) : 'Belum ada data'} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Non-member AOV" value={dashboard.sales.nonMemberAov != null ? formatIdr(dashboard.sales.nonMemberAov) : 'Belum ada data'} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label="Repeat rate" value={fmtPct(dashboard.repeat.repeatRatePercent)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                label="Member saldo negatif"
                value={fmtNum(dashboard.members.negativeBalanceCount)}
              />
            </Grid>
          </Grid>

          {dashboard.topRewards.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Top rewards
              </Typography>
              <Stack spacing={1}>
                {dashboard.topRewards.map((r) => (
                  <Typography key={r.rewardCode} variant="body2">
                    {r.rewardName}: {r.redemptionCount}× · {formatIdr(r.hppCost)} HPP
                  </Typography>
                ))}
              </Stack>
            </Box>
          ) : null}

          {dashboard.limitations.length > 0 ? (
            <Alert severity="info">
              {dashboard.limitations.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </Alert>
          ) : null}
        </>
      ) : null}

      <Divider />

      <Typography variant="h6" fontWeight={700}>
        Cari member
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Nama / HP / public member ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSearch();
          }}
        />
        <Button variant="contained" onClick={() => void onSearch()}>
          Cari
        </Button>
      </Stack>
      <Stack spacing={1}>
        {hits.map((h) => (
          <Button
            key={h.customerId}
            variant={selectedId === h.customerId ? 'contained' : 'outlined'}
            onClick={() => void openMember(h.customerId)}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {h.name ?? 'Member'} — {h.phoneMasked} · {h.currentPoints} poin
          </Button>
        ))}
      </Stack>

      {detail ? (
        <Box
          sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography fontWeight={800}>
            {detail.name ?? 'Member'} · {detail.phoneMasked}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Status: {detail.status} · Bergabung {new Date(detail.registeredAt).toLocaleDateString('id-ID')}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Poin saat ini: <strong>{detail.currentPoints}</strong>
          </Typography>
          <Typography variant="body2">Lifetime earned: {detail.lifetimeEarnedPoints}</Typography>
          <Typography variant="body2">
            {detail.totalSpendingLabel}: {formatIdr(detail.totalSpending)}
          </Typography>
          <Typography variant="body2">{detail.transactionCountLabel}: {detail.transactionCount}</Typography>
          <Typography variant="body2">
            Redeem: {detail.redemptionSummary.redeemCount}× · HPP{' '}
            {formatIdr(detail.redemptionSummary.hppCost)}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                const v = await verifyAdminMemberBalance(detail.customerId);
                setVerifyMsg(
                  `${v.status}: cached ${v.cachedPoints} vs ledger ${v.ledgerSum}`,
                );
              }}
            >
              Verifikasi saldo
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!adjustmentEnabled}
              onClick={() => {
                setAdjustOpen(true);
                setAdjustError(null);
              }}
            >
              Sesuaikan poin
            </Button>
          </Stack>
          {!adjustmentEnabled ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Penyesuaian admin nonaktif (LOYALTY_ADMIN_ADJUSTMENT_ENABLED=false)
            </Typography>
          ) : null}
          {verifyMsg ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              {verifyMsg}
            </Alert>
          ) : null}

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
            Riwayat ledger
          </Typography>
          <Stack spacing={0.75} divider={<Divider flexItem />}>
            {ledger.map((item) => (
              <Box key={item.id}>
                <Typography variant="body2" fontWeight={700}>
                  {item.pointsDelta > 0 ? '+' : ''}
                  {item.pointsDelta} · {item.summary}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.occurredAt).toLocaleString('id-ID')} · saldo {item.balanceAfter}
                  {item.reason ? ` · ${item.reason}` : ''}
                </Typography>
              </Box>
            ))}
            {ledger.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Belum ada data
              </Typography>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Penyesuaian poin</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              {detail?.name ?? 'Member'} · saldo sekarang {detail?.currentPoints ?? '—'}
            </Typography>
            <TextField
              label="Delta poin"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              helperText="Hanya delta, bukan set saldo"
            />
            <TextField
              label="Alasan"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              multiline
              minRows={2}
            />
            {projected !== null ? (
              <Typography variant="body2">
                Pratinjau saldo: <strong>{projected}</strong> (UI saja)
              </Typography>
            ) : null}
            {adjustError ? <Alert severity="error">{adjustError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            disabled={!reason.trim() || !Number.isInteger(Number(delta)) || Number(delta) === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Lanjut
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Konfirmasi</DialogTitle>
        <DialogContent>
          <Typography>
            {Number(delta) > 0 ? 'Tambah' : 'Kurangi'} {Math.abs(Number(delta))} poin{' '}
            {Number(delta) > 0 ? 'ke' : 'dari'} {detail?.name ?? 'member'}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sekarang {detail?.currentPoints} → pratinjau {projected}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={adjustBusy}>
            Batal
          </Button>
          <Button variant="contained" onClick={() => void submitAdjust()} disabled={adjustBusy}>
            {adjustBusy ? 'Menyimpan…' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
