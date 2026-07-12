'use client';

import { useEffect, useRef } from 'react';
import { ReceiptBuilder, printReceipt, getReceiptBusinessConfig } from '@/features/printing';
import type { Order } from '../types';

export type ReceiptPaperWidth = '58mm' | '80mm';

interface ReceiptPrintProps {
  readonly order: Order;
  readonly autoPrint?: boolean;
  readonly onAfterPrint?: () => void;
}

/** Triggers ESC/POS print via PrintService — never browser print. */
export function ReceiptPrint({ order, autoPrint = true, onAfterPrint }: ReceiptPrintProps) {
  const printedRef = useRef(false);

  useEffect(() => {
    if (!autoPrint || printedRef.current) return;
    printedRef.current = true;

    const receipt = ReceiptBuilder.build(order, getReceiptBusinessConfig());
    void printReceipt(receipt)
      .then(() => onAfterPrint?.())
      .catch(() => onAfterPrint?.());
  }, [autoPrint, onAfterPrint, order]);

  return null;
}
