'use client';

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useCallback, useState } from 'react';
import {
  getPrintConfig,
  savePrintConfig,
  setRawBtPrinterConnected,
} from '../config/printConfig';
import { resetPrintService } from '../services/PrintService';
import { BLUEPRINT_BP_ECO58 } from '../profiles/printerProfile';
import type { PrintConfig, PrinterType } from '../types/printer';
import { PrinterStatusChip } from './PrinterStatusChip';

export function PrinterConfigPanel() {
  const [config, setConfig] = useState<PrintConfig>(() => getPrintConfig());
  const [statusKey, setStatusKey] = useState(0);

  const applyConfig = useCallback((patch: Partial<PrintConfig>) => {
    const next = savePrintConfig(patch);
    resetPrintService();
    setConfig(next);
    setStatusKey((k) => k + 1);
  }, []);

  const handlePrinterTypeChange = (printerType: PrinterType) => {
    const bridge = printerType === 'rawbt' ? 'rawbt' : 'web-bluetooth';
    applyConfig({ printerType, bridge });
  };

  const handleConnectedChange = (checked: boolean) => {
    setRawBtPrinterConnected(checked);
    const next = getPrintConfig();
    setConfig(next);
    setStatusKey((k) => k + 1);
  };

  const profile = BLUEPRINT_BP_ECO58;

  return (
    <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Konfigurasi Printer
      </Typography>

      <Box sx={{ mb: 2 }}>
        <PrinterStatusChip refreshKey={statusKey} />
      </Box>

      <TextField
        label="Nama Printer"
        value={config.printerName}
        fullWidth
        margin="normal"
        InputProps={{ readOnly: true }}
      />

      <TextField
        label="Profil Printer"
        value={`${profile.brand} ${profile.model}`}
        fullWidth
        margin="normal"
        InputProps={{ readOnly: true }}
        helperText={`${profile.paperWidth}mm · ${profile.protocol} · Cut: ${profile.supportsCut ? 'Ya' : 'Tidak'}`}
      />

      <TextField
        label="Metode"
        value="Bluetooth"
        fullWidth
        margin="normal"
        InputProps={{ readOnly: true }}
        helperText="WiFi, USB, dan LAN — rencana pengembangan"
      />

      <TextField
        label="Bridge"
        value={config.bridge === 'rawbt' ? 'RawBT' : 'Web Bluetooth'}
        fullWidth
        margin="normal"
        InputProps={{ readOnly: true }}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel id="printer-type-label">Adapter</InputLabel>
        <Select
          labelId="printer-type-label"
          label="Adapter"
          value={config.printerType}
          onChange={(e) => handlePrinterTypeChange(e.target.value as PrinterType)}
        >
          <MenuItem value="rawbt">RawBT — Blueprint BP-ECO58</MenuItem>
          <MenuItem value="blueprint-eco58">Web Bluetooth (legacy)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="paper-width-label">Lebar Kertas</InputLabel>
        <Select
          labelId="paper-width-label"
          label="Lebar Kertas"
          value={config.paperWidth}
          onChange={(e) => applyConfig({ paperWidth: e.target.value as '58mm' | '80mm' })}
        >
          <MenuItem value="58mm">58 mm</MenuItem>
          <MenuItem value="80mm">80 mm</MenuItem>
        </Select>
      </FormControl>

      {config.printerType === 'rawbt' ? (
        <FormControlLabel
          control={
            <Switch
              checked={config.printerConnected}
              onChange={(e) => handleConnectedChange(e.target.checked)}
            />
          }
          label="Printer sudah terhubung di RawBT"
          sx={{ mt: 1, display: 'flex' }}
        />
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Cetak struk selalu menggunakan ESC/POS thermal — bukan cetak browser.
      </Typography>
    </Box>
  );
}
