/** Format integer Rupiah for display only — never for calculation. */
export function formatReceiptMoney(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatReceiptDate(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${datePart} Pukul ${timePart}`;
}

/** Short order ref for thermal receipt, e.g. `#000009`. */
export function formatReceiptOrderShort(orderNumber: string): string {
  const suffix = orderNumber.split('-').pop() ?? orderNumber;
  return `#${suffix}`;
}

/** Compact date-time for 58mm thermal, e.g. `13/07/26 17:33`. */
export function formatReceiptDateTimeCompact(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

/** Abbreviate dining type label for thermal width. */
export function formatReceiptDiningCompact(diningType: string): string {
  if (diningType === 'Makan di Tempat') return 'Ditempat';
  return diningType;
}

/** Single-line footer for thermal receipts. */
export function formatReceiptFooterCompact(footerMessage: string): string {
  const normalized = footerMessage.replace(/\s*\n+\s*/g, ' ').trim();
  if (!normalized) return 'Terima kasih.';
  const firstSentence = normalized.split(/[.!]/)[0]?.trim();
  return firstSentence ? `${firstSentence}.` : normalized;
}
