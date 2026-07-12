import type { NextConfig } from 'next';

function buildConnectSrc(): string {
  const sources = ["'self'", 'https:', 'http://localhost:*', 'http://127.0.0.1:*'];
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (apiBase) {
    try {
      const origin = new URL(apiBase).origin;
      if (!sources.includes(origin)) {
        sources.push(origin);
      }
    } catch {
      // Ignore invalid URL at build time; runtime env validation will surface it.
    }
  }

  return sources.join(' ');
}

function buildSecurityHeaders() {
  return [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        `connect-src ${buildConnectSrc()}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
