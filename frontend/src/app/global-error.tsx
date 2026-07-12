'use client';

interface GlobalErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1>Application error</h1>
        <p style={{ color: '#5C5C5C' }}>{error.message || 'A critical error occurred.'}</p>
        <button type="button" onClick={reset} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Reload
        </button>
      </body>
    </html>
  );
}
