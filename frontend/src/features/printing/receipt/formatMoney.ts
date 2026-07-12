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
