import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import { buildCompactReceiptLines, type CompactReceiptLine } from './receiptCompactLayout';

export type ThermalReceiptLine = CompactReceiptLine;
export type ThermalLineKind = CompactReceiptLine['kind'];

export { formatThermalRow } from './receiptCompactLayout';

/** Thermal line model for ESC/POS renderer. */
export function buildReceiptThermalLines(receipt: Receipt, profile: PrinterProfile): ThermalReceiptLine[] {
  return buildCompactReceiptLines(receipt, profile);
}
