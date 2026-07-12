'use client';

import type { Order } from '../types';
import {
  ReceiptBuilder,
  ReceiptPreviewPanel,
  getPrintService,
  getReceiptBusinessConfig,
  type Receipt,
} from '@/features/printing';

interface ReceiptPreviewSheetProps {
  readonly open: boolean;
  readonly order: Order | null;
  readonly onClose: () => void;
  readonly onPrinted?: () => void;
}

export function ReceiptPreviewSheet({
  open,
  order,
  onClose,
  onPrinted,
}: ReceiptPreviewSheetProps) {
  if (!order) return null;

  const receipt: Receipt = ReceiptBuilder.build(order, getReceiptBusinessConfig());

  const handlePrint = async () => {
    await getPrintService().print(receipt);
    onPrinted?.();
  };

  return (
    <ReceiptPreviewPanel
      receipt={receipt}
      open={open}
      variant="drawer"
      onPrint={() => void handlePrint()}
      onBack={onClose}
    />
  );
}
