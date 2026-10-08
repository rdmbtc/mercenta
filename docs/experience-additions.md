# Mercenta experience additions

## Scope and preserved boundaries

The original cinematic hero, policy-gate artwork, playground and guardrails remain. The navigation is now a floating dark pill, with reduced-motion support retained. New UI is additive; Mainnet checkout and financial actions remain closed.

## Functional interfaces

- Five-row matched workflow contrast, with a factual five-checkpoint footer rather than an invented setup-time statistic.
- cURL, TypeScript and Python examples for the real public catalogue endpoint, active-snippet clipboard copying and error feedback.
- Direct-download read-only client v0.1.1: npm/pnpm/bun tarball commands and a Deno module example. MIT licence, TypeScript declarations, no runtime dependencies, no registry-publication or popularity claim. No account writes, signing or purchasing methods.
- Account activity overview uses authenticated backend dashboard aggregates. Rolling 24h, 7d, 30d and 90d ranges are supported by the backend and generated OpenAPI. Figures represent the user's Testnet account, not merchant sales or revenue. Missing comparison and time-series data stay unavailable.
- Native first-run welcome dialog with Escape/backdrop dismissal, a tour link and storage-safe opt-out. Browsing never grants spending permission.
- Actual newly created account API keys are initially masked, optionally revealed for 30 seconds and cleared when dismissed. Scope-aware warning, clipboard confirmation and an acknowledgement gate are provided. Secrets are not persisted in browser storage.
- Saved operator events can be expanded and visually replayed. Replay invokes no tools or payments. Sensitive result fields are redacted. Hidden reasoning, raw inputs and token figures not supplied by the backend are not fabricated.
- Toast stack with five-second lifetime, pointer/focus pause, dismissal, success/error variants and reduced-motion support.
- Optional-storage consent records decision and timestamp safely and emits a cookie-consent event. No optional analytics subscriber is enabled by this release. Privacy details are at /privacy.
- /releases contains product notes and a local conventional-commit composer with major/minor/patch inference, malformed-line counts, grouped Markdown and copying. It does not publish versions or expose Git history.

## Explicit demonstrations and missing integrations

/status shows 60 unknown days per service by default. Seeded sample history is opt-in and labelled synthetic; it is not measured uptime. The existing endpoint probe is separate from availability history.

/operations provides disconnected states and explicitly synthetic inventory, webhook and usage/billing layouts. Inventory copies a PO draft, not a submitted order. Webhook demonstration waits 2/4/8 seconds and preserves attempts without network calls, signatures or deliveries. Billing allowances are not a plan offer, invoice or charge. Merchant demand/forecast feeds, real webhook transport and subscription billing remain unconnected.

## Verification

Local verification: 411 frontend tests across 57 files, TypeScript, zero-warning lint and production build passed. 480 backend tests and backend build passed. Six read-only SDK tests and five existing evidence-report tests passed. Source and client-bundle credential/identity scanning reported no findings within their stated scope; this is not a full security certification or historical-source audit.

The packaged client also read the live public catalogue successfully, observing 1179 regional products and purchasingEnabled=false. This is an observation, not a completeness or future-stock guarantee.

Live deployment and browser acceptance are checked separately. No new payments, purchases, refund execution, business pilot or traction are claimed by this UI release.
