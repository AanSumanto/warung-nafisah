'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AppButton } from '@/shared/components/ui';
import { isApiNotFound } from '@/shared/lib/api';
import { lookupCustomerByPhone, registerCustomer } from '../loyaltyApi';
import type { PosMemberSelection } from '../loyaltyTypes';

export interface MemberSectionProps {
  readonly enabled: boolean;
  readonly member: PosMemberSelection | null;
  readonly onSearch?: () => void;
  readonly onSelectMember?: (member: PosMemberSelection) => void;
  readonly onClear: () => void;
}

export function MemberSection({
  enabled,
  member,
  onSearch,
  onSelectMember,
  onClear,
}: MemberSectionProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<PosMemberSelection | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  if (!enabled) return null;

  const handleLookup = async () => {
    if (!phoneInput.trim()) {
      setError('Masukkan nomor HP');
      return;
    }
    setLoading(true);
    setError(null);
    setFound(null);
    setShowRegister(false);

    try {
      const customer = await lookupCustomerByPhone(phoneInput.trim());
      if (customer.status === 'blocked') {
        setError('Member diblokir — tidak dapat digunakan');
        return;
      }
      const selection: PosMemberSelection = {
        customerId: customer.id,
        phoneMasked: customer.phoneMasked,
        name: customer.name,
        currentPoints: customer.currentPoints,
      };
      setFound(selection);
    } catch (err) {
      if (isApiNotFound(err)) {
        setShowRegister(true);
        setError(null);
      } else {
        setError('Gagal mencari member');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phoneInput.trim()) {
      setError('Masukkan nomor HP');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const customer = await registerCustomer({
        phone: phoneInput.trim(),
        name: nameInput.trim() || undefined,
      });
      const selection: PosMemberSelection = {
        customerId: customer.id,
        phoneMasked: customer.phoneMasked,
        name: customer.name,
        currentPoints: customer.currentPoints,
      };
      if (onSelectMember) {
        onSelectMember(selection);
      }
      setShowRegister(false);
      setFound(null);
      setPhoneInput('');
      setNameInput('');
    } catch {
      setError('Gagal mendaftarkan member');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFound = () => {
    if (found && onSelectMember) {
      onSelectMember(found);
      setFound(null);
      setPhoneInput('');
      setError(null);
    }
  };

  const handleReset = () => {
    setFound(null);
    setShowRegister(false);
    setPhoneInput('');
    setNameInput('');
    setError(null);
    onClear();
  };

  return (
    <Box
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
          Member?
        </Typography>
        {member ? (
          <AppButton size="small" variant="text" color="error" onClick={handleReset}>
            Hapus Member
          </AppButton>
        ) : (
          <AppButton size="small" variant="text" onClick={handleReset}>
            Lewati
          </AppButton>
        )}
      </Box>

      {member ? (
        <Box
          sx={{
            p: 1.25,
            border: 1,
            borderColor: 'primary.light',
            borderRadius: 1.5,
            bgcolor: 'primary.50',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Member:
          </Typography>
          <Typography variant="body2" fontWeight={800}>
            {member.phoneMasked}
          </Typography>
          {member.name ? (
            <Typography variant="body2" color="text.secondary">
              {member.name}
            </Typography>
          ) : null}
          <Typography variant="body2" color="primary.dark" fontWeight={700} sx={{ mt: 0.5 }}>
            Saldo: {typeof member.currentPoints === 'number' ? member.currentPoints : 0} poin
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <AppButton size="small" variant="outlined" onClick={() => onClear()}>
              Ganti
            </AppButton>
          </Box>
        </Box>
      ) : (
        <>
          {!showRegister ? (
            <>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="Cari nomor HP"
                  placeholder="08..."
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleLookup();
                  }}
                />
                <AppButton
                  size="small"
                  variant="contained"
                  loading={loading}
                  onClick={() => void handleLookup()}
                  sx={{ minWidth: 68 }}
                >
                  Cari
                </AppButton>
              </Box>

              {found ? (
                <Box
                  sx={{
                    p: 1.25,
                    border: 1,
                    borderColor: 'success.light',
                    borderRadius: 1.5,
                    bgcolor: 'success.50',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Member ditemukan:
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {found.phoneMasked}
                  </Typography>
                  {found.name ? (
                    <Typography variant="body2" color="text.secondary">
                      {found.name}
                    </Typography>
                  ) : null}
                  <Typography
                    variant="body2"
                    color="success.dark"
                    fontWeight={700}
                    sx={{ mt: 0.5 }}
                  >
                    Saldo: {typeof found.currentPoints === 'number' ? found.currentPoints : 0} poin
                  </Typography>
                  <AppButton
                    fullWidth
                    size="small"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, fontWeight: 700 }}
                    onClick={handleSelectFound}
                  >
                    Gunakan Member
                  </AppButton>
                </Box>
              ) : null}

              {error ? (
                <Typography variant="caption" color="error" fontWeight={600}>
                  {error}
                </Typography>
              ) : null}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {onSearch ? (
                  <AppButton
                    size="small"
                    variant="text"
                    onClick={onSearch}
                    sx={{ fontSize: '0.75rem', p: 0 }}
                  >
                    Buka Dialog Member
                  </AppButton>
                ) : null}
                <AppButton
                  size="small"
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ ml: 'auto' }}
                >
                  Lewati
                </AppButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                p: 1.25,
                border: 1,
                borderColor: 'warning.light',
                borderRadius: 1.5,
                bgcolor: 'warning.50',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Typography variant="caption" color="text.primary" fontWeight={700}>
                Nomor belum terdaftar. Daftar Member?
              </Typography>
              <TextField
                size="small"
                label="Nomor HP"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                inputProps={{ inputMode: 'tel' }}
                fullWidth
              />
              <TextField
                size="small"
                label="Nama (opsional)"
                placeholder="Nama pelanggan"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                fullWidth
              />
              {error ? (
                <Typography variant="caption" color="error" fontWeight={600}>
                  {error}
                </Typography>
              ) : null}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <AppButton
                  size="small"
                  variant="contained"
                  loading={loading}
                  onClick={() => void handleRegister()}
                  fullWidth
                  sx={{ fontWeight: 700 }}
                >
                  Daftar Member
                </AppButton>
                <AppButton
                  size="small"
                  variant="outlined"
                  disabled={loading}
                  onClick={() => setShowRegister(false)}
                >
                  Batal
                </AppButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
