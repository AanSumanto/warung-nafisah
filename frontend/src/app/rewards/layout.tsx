import type { Metadata } from 'next';

export const metadata: Metadata = {
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

/**
 * Public rewards layout — outside AuthGuard shell.
 * No third-party trackers; referrer stripped for token privacy.
 */
export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
