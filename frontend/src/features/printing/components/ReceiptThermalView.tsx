'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Receipt } from '../types/receipt';
import { buildReceiptLines } from '../renderers/receiptLayout';

interface ReceiptThermalViewProps {
  readonly receipt: Receipt;
  readonly preview?: boolean;
}

/**
 * Thermal receipt preview — renderer output only, not a data source.
 */
export function ReceiptThermalView({ receipt, preview = true }: ReceiptThermalViewProps) {
  const width = receipt.paperWidth === '80mm' ? 320 : 260;
  const fontSize = receipt.paperWidth === '80mm' ? '0.8rem' : '0.72rem';
  const lines = buildReceiptLines(receipt);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: width,
        mx: 'auto',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize,
        lineHeight: 1.4,
        color: '#111',
        bgcolor: '#fff',
        px: 1.5,
        py: 1.5,
        border: preview ? '1px dashed' : 'none',
        borderColor: 'divider',
      }}
    >
      {lines.map((line, index) => {
        if (line.kind === 'separator') {
          return (
            <Typography
              key={index}
              align="center"
              sx={{ fontSize: '0.65rem', my: 0.5, color: 'text.secondary', overflow: 'hidden' }}
            >
              {line.text}
            </Typography>
          );
        }

        if (line.kind === 'field' || (line.kind === 'text' && line.align !== 'center')) {
          const isLarge = line.size === 'lg';
          const isBold = line.weight === 'bold' || isLarge;
          return (
            <Typography
              key={index}
              align="left"
              sx={{
                fontWeight: isBold ? 800 : 400,
                fontSize: isLarge ? '0.95rem' : undefined,
                my: 0.25,
                wordBreak: 'break-word',
              }}
            >
              {line.text}
            </Typography>
          );
        }

        if (line.kind === 'row' && line.left && line.right) {
          const isLarge = line.size === 'lg';
          const isBold = line.weight === 'bold' || isLarge;
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
                my: 0.25,
                fontWeight: isBold ? 800 : 400,
                fontSize: isLarge ? '0.95rem' : undefined,
              }}
            >
              <span>{line.left}</span>
              <span>{line.right}</span>
            </Box>
          );
        }

        const isTitle = line.size === 'lg' && line.weight === 'bold';
        return (
          <Typography
            key={index}
            align={line.align === 'center' ? 'center' : 'left'}
            sx={{
              fontWeight: line.weight === 'bold' || isTitle ? 800 : 400,
              fontSize: isTitle ? '1rem' : line.size === 'sm' ? '0.65rem' : undefined,
              my: isTitle ? 0.5 : 0.25,
              letterSpacing: isTitle ? 1 : 0,
            }}
          >
            {line.text}
          </Typography>
        );
      })}
    </Box>
  );
}
