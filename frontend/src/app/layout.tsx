import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/shared/providers';
import { getClientEnv } from '@/shared/lib/env';

const appName = getClientEnv().NEXT_PUBLIC_APP_NAME;

export const viewport: Viewport = {
  themeColor: '#C45C26',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: 'Sistem kasir Warung Nafisah — Mobile POS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
