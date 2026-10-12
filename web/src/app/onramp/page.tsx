import type { Metadata } from 'next';
import { ArcOnrampKit } from '@/components/onramp/ArcOnrampKit';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Arc USDC Onramp | Mercenta',
  description: 'Deposit and onboard fiat or cross-chain stablecoins directly into Arc USDC with sub-second Malachite settlement.',
  alternates: { canonical: '/onramp' }
};

export default function OnrampPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0d1b2a 0%, #05080c 100%)',
      padding: '3rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
            MERCEN<span style={{ color: '#00d2ff' }}>TA</span>
          </h1>
        </Link>
        <p style={{ color: '#92a6b6', fontSize: '14px', marginTop: '6px' }}>
          Autonomous Digital Commerce &amp; Policy Rails on Arc
        </p>
      </header>

      <ArcOnrampKit defaultAmount="50" />
    </main>
  );
}
