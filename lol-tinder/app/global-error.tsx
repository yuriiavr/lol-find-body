'use client';

// Глобальний error boundary для App Router. Має містити власні html/body,
// бо замінює кореневий layout, коли впав сам layout або щось вище.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: '#71717a', maxWidth: 440 }}>
            An unexpected error occurred. You can try again — if it keeps happening, please reload the page.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #3f3f46', background: 'transparent', color: '#e5e7eb', fontWeight: 700, textTransform: 'uppercase', fontSize: 12, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
