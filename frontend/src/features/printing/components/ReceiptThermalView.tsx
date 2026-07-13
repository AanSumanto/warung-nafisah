'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Receipt } from '../types/receipt';
import { PreviewRenderer } from '../renderers/PreviewRenderer';
import type { PreviewReceiptLine } from '../renderers/receiptPreviewLayout';

interface ReceiptThermalViewProps {
  readonly receipt: Receipt;
}

function PreviewLine({ line }: { readonly line: PreviewReceiptLine }) {
  if (line.kind === 'separator') {
    return (
      <Typography
        align="center"
        sx={{ fontSize: '0.65rem', my: 0.5, color: 'text.secondary', overflow: 'hidden' }}
      >
        {line.text}
      </Typography>
    );
  }

  if (line.kind === 'row' && line.left && line.right) {
    const isBold = line.weight === 'bold' || line.size === 'lg';
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
          my: 0.25,
          fontWeight: isBold ? 800 : 400,
          fontSize: line.size === 'lg' ? '0.95rem' : undefined,
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
      align={line.align === 'center' ? 'center' : 'left'}
      sx={{
        fontWeight: line.weight === 'bold' || isTitle ? 800 : 400,
        fontSize: isTitle ? '1rem' : line.size === 'sm' ? '0.65rem' : undefined,
        my: isTitle ? 0.5 : 0.25,
        letterSpacing: isTitle ? 1 : 0,
        wordBreak: 'break-word',
      }}
    >
      {line.text}
    </Typography>
  );
}

/**
 * On-screen receipt preview — PreviewRenderer output only.
 * Never used as a print source.
 */
export function ReceiptThermalView({ receipt }: ReceiptThermalViewProps) {
  const output = new PreviewRenderer().render(receipt);
  const width = output.paperWidth === '80mm' ? 320 : 280;
  const fontSize = output.paperWidth === '80mm' ? '0.8rem' : '0.72rem';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: width,
        mx: 'auto',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize,
        lineHeight: 1.45,
        color: '#1a1a1a',
        bgcolor: '#fff',
        px: 2,
        py: 2,
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(237, 108, 2, 0.12)',
        border: '1px solid',
        borderColor: 'primary.light',
      }}
    >
      {output.lines.map((line, index) => (
        <PreviewLine key={index} line={line} />
      ))}
    </Box>
  );
}
