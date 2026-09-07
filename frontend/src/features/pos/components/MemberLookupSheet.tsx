'use client';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { AppButton } from '@/shared/components/ui';
import { isApiNotFound } from '@/shared/lib/api';
import { lookupCustomerByPhone, registerCustomer } from '../loyaltyApi';
import type { PosMemberSelection } from '../loyaltyTypes';

interface MemberLookupSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (member: PosMemberSelection) => void;
  readonly onSkip: () => void;
}

type Step = 'lookup' | 'register';

export function MemberLookupSheet({ open, onClose, onSelect, onSkip }: MemberLookupSheetProps) {
  const [step, setStep] = useState<Step>('lookup');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<PosMemberSelection | null>(null);

  const reset = () => {
    setStep('lookup');
    setPhone('');
    setName('');
    setLoading(false);
    setError(null);
    setFound(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLookup = async () => {
    if (!phone.trim()) {
      setError('Masukkan nomor HP');
      return;
    }
    setLoading(true);
    setError(null);
    setFound(null);
    try {
      const customer = await lookupCustomerByPhone(phone.trim());
      if (customer.status === 'blocked') {
        setError('Member diblokir — tidak dapat digunakan');
        return;
      }
      setFound({
        customerId: customer.id,
        phoneMasked: customer.phoneMasked,
        name: customer.name,
      });
    } catch (err) {
      if (isApiNotFound(err)) {
        setStep('register');
        setError(null);
      } else {
        setError('Gagal mencari member');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone.trim()) {
      setError('Masukkan nomor HP');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const customer = await registerCustomer({
        phone: phone.trim(),
        name: name.trim() || undefined,
      });
      onSelect({
        customerId: customer.id,
        phoneMasked: customer.phoneMasked,
        name: customer.name,
      });
      reset();
      onClose();
    } catch {
      setError('Gagal mendaftarkan member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        Member Nafisah Rewards
        <IconButton
          aria-label="Tutup"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {step === 'lookup' ? (
            <>
              <TextField
                label="Nomor HP"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLookup();
                }}
              />
              {found ? (
                <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography fontWeight={700}>{found.name ?? 'Member'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {found.phoneMasked}
                  </Typography>
                  <AppButton
                    fullWidth
                    sx={{ mt: 1.5 }}
                    onClick={() => {
                      onSelect(found);
                      reset();
                      onClose();
                    }}
                  >
                    Gunakan Member
                  </AppButton>
                </Box>
              ) : null}
              {error ? (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              ) : null}
              <AppButton fullWidth loading={loading} onClick={() => void handleLookup()}>
                Cari Member
              </AppButton>
              <AppButton
                fullWidth
                variant="outlined"
                disabled={loading}
                onClick={() => {
                  onSkip();
                  reset();
                  onClose();
                }}
              >
                Lewati / Tanpa Member
              </AppButton>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Nomor belum terdaftar. Daftarkan member baru.
              </Typography>
              <TextField
                label="Nomor HP"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputProps={{ inputMode: 'tel' }}
                fullWidth
              />
              <TextField
                label="Nama (opsional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              {error ? (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              ) : null}
              <AppButton fullWidth loading={loading} onClick={() => void handleRegister()}>
                Daftarkan &amp; Gunakan
              </AppButton>
              <AppButton
                fullWidth
                variant="text"
                disabled={loading}
                onClick={() => {
                  setStep('lookup');
                  setError(null);
                }}
              >
                Kembali
              </AppButton>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
