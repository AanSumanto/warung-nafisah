/** Compact Indonesian date for mobile activity rows. */
export function formatPortalDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatPointsDelta(delta: number): string {
  if (delta > 0) return `+${delta} poin`;
  if (delta < 0) return `${delta} poin`;
  return '0 poin';
}

export function memberGreeting(displayName?: string): string {
  const name = displayName?.trim();
  if (name) return `Halo, ${name}`;
  return 'Halo, Member Nafisah';
}
