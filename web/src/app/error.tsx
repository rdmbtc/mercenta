'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
      <section role="alert" style={{ maxWidth: 560 }}>
        <p>Mercenta / service interruption</p>
        <h1>Something went wrong.</h1>
        <p>Try again. No payment or settlement is reported by this screen.</p>
        <button type="button" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
