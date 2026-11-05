import type {Metadata} from 'next';
import {ExperienceFrame} from '@/components/experience/Primitives';

export const metadata: Metadata = {
  title: 'Security and disclosure',
  description: 'Current security boundaries, pre-launch limitations and vulnerability reporting contact for Mercenta.',
  alternates: {canonical: '/security'},
  openGraph: {title: 'Security and disclosure', description: 'Current security boundaries, pre-launch limitations and vulnerability reporting contact for Mercenta.', url: '/security', type: 'website'},
};

export default function SecurityPage() {
  return (
    <ExperienceFrame title="Security">
      <h1>Security.<br/><span>Without invented certainty.</span></h1>
      <section className="me-card">
        <h2>Current scope</h2>
        <p>Mercenta is a pre-launch application. This page describes the controls and boundaries currently documented in the product. It is not a certification, audit report, service-level commitment or guarantee of future availability.</p>

        <h2>Authentication and authorization</h2>
        <p>Workspace authentication uses wallet signatures with short-lived, single-use nonces and session cookies. Authentication does not grant payment or transaction-signing authority. Spending actions remain subject to the product&apos;s policy checks and explicit authorization flow.</p>

        <h2>Wallet boundary</h2>
        <p>Any local wallet-vault encryption described in the interface applies to that browser-side wallet feature only. Mercenta cannot recover a locally generated wallet after browser data is cleared without a user-held backup. Do not submit seed phrases, private keys, passwords or purchased credentials to support.</p>

        <h2>Operational limitations</h2>
        <p>The public status surface currently provides an on-demand endpoint check. Module telemetry, historical uptime, chain monitoring and a live incident feed are not connected. Demonstration incidents and illustrative receipts must not be interpreted as operational evidence.</p>

        <h2>Assurance and certifications</h2>
        <p>No SOC 2, ISO 27001, HIPAA, PCI or similar certification is claimed on this page. No penetration-test report or independent assurance report is currently published here. Contact us if you need a written answer about a specific control before using the product.</p>

        <h2>Report a vulnerability</h2>
        <p>Please report suspected security issues privately to <a href="mailto:support@mercenta.xyz?subject=Security%20report">support@mercenta.xyz</a> with the subject “Security report”. Include the affected route or feature, reproduction details that do not expose secrets, and a safe way to follow up. Do not include private keys, seed phrases, passwords, access tokens or customer data.</p>
        <p>We will review reports manually. This mailbox is not a promise of a bounty, response-time SLA, or acceptance of unsolicited testing that could affect availability or other users.</p>

        <h2>Related information</h2>
        <p><a href="/privacy">Read the privacy and storage notice</a>, <a href="/legal">read the terms and storage notice</a>, <a href="/status">inspect current status coverage</a> or <a href="/support">open the help centre</a>.</p>
      </section>
    </ExperienceFrame>
  );
}
