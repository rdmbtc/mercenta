import type {Metadata} from 'next';
import Link from 'next/link';
import {ExperienceFrame} from '@/components/experience/Primitives';

export const metadata: Metadata = {
  title: 'Terms and storage notice',
  description: 'Plain-language terms, storage, environment and order boundaries for the Mercenta pre-launch application.',
  alternates: {canonical: '/legal'},
};

export default function LegalPage() {
  return (
    <ExperienceFrame title="Legal">
      <h1>Clear boundaries.<br/><span>Before you connect.</span></h1>
      <section className="me-card">
        <p><strong>Last updated: November 6, 2026.</strong> This plain-language notice describes the current pre-launch application. It does not replace a negotiated agreement or professional legal advice.</p>

        <h2>Using the application</h2>
        <p>Use Mercenta only with accounts, wallets, products and funds you are authorized to use. You are responsible for checking redemption regions, platform rules, quoted amounts and any information you submit. Do not submit passwords, seed phrases, private keys, access tokens or purchased credentials.</p>

        <h2>Wallet sign-in and payment authority</h2>
        <p>There is no password account in the current application. Wallet-based sign-in uses a signature to authenticate wallet ownership; signing in does not authorize a payment or transfer. A separate, explicit action is required for any payment flow, and the current Mainnet purchase path is closed.</p>

        <h2>Testnet and Mainnet</h2>
        <p>Testnet is a rehearsal environment using test assets and non-redeemable delivery. Mainnet payment, deposit and financial actions are pre-launch or unavailable unless the interface explicitly says otherwise. Never send real funds to a Testnet flow. Balances do not carry between environments.</p>

        <h2>Orders and refunds</h2>
        <p>A saved plan or integration draft is not an order. An order, where enabled, moves through an exact quote, payment submission, payment confirmation, fulfillment pending, and fulfilled or failed states. A timeout does not prove failure, so check order activity before repeating a payment. Refund requests are manual reviews; submitting a request does not approve or execute a refund.</p>

        <h2>Storage and optional analytics</h2>
        <p>The interface may store essential wallet session state and local preferences such as language, theme, tour choice and optional-consent choice. Optional analytics are not enabled in this deployment. Support and refund requests may contain the contact, order, environment and issue details needed for manual review. For storage questions or deletion requests, contact <a href="mailto:support@mercenta.xyz">support@mercenta.xyz</a>.</p>

        <h2>Changes and contact</h2>
        <p>Features, availability and these notices may change as the application remains pre-launch. Security reports should use the <Link href="/security">security and disclosure page</Link>. For account, order or privacy questions, use <a href="/support">the help centre</a> or <a href="mailto:support@mercenta.xyz">support@mercenta.xyz</a>.</p>
      </section>
    </ExperienceFrame>
  );
}
