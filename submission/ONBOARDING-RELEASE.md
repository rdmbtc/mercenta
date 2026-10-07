# Onboarding release handoff

Source checks passed: backend 119, frontend 147, documentation 27. Backend and Circle operator TypeScript builds passed; frontend/docs production builds passed.

New features: EN/RU buyer/reseller guide, preview catalog before sign-in, persistent budget with atomic Shop caps, wallet-scoped encrypted-at-rest manual journal, explicit-consent educational model coach with rules fallback.

## Deployment status
New backend upload was blocked by SSH connection timeout from both execution environments. The public API health request also timed out. Do not mark server publication or live journal persistence as completed. The existing last verified backend was backend-circle-seller-20261002-171622; do not overwrite its database or restricted keys.

An authenticated read-only supplier catalog request returned HTTP 403. No order was created. Obtain the official supplier API contract and resolve permitted API access with the provider; never assume `/orders` or retry an uncertain procurement with a new reference.

## Safe next deployment when VPS access is restored
1. Confirm the pinned VPS host key and currently active release. Preserve `/etc/mercenta` secrets and Circle configuration.
2. Stage only backend package/lock/TypeScript configs and src/test/ops files. Verify archive SHA256; no environment, key, database or raw signed transaction files.
3. Install locked dependencies; run tests and both TypeScript builds as the unprivileged service account.
4. Take an online SQLite backup and integrity-check it. Do not restore an old DB during code rollback.
5. Switch the release symlink, restart and confirm API health, anonymous journal/workspace 401, public simulated catalog 200 and launch-readiness mainnetEnabled=false.
6. Verify real wallet sign-in/profile/budget/note persistence in the browser. Do not fabricate browser wallet sessions with the operator proxy secret.
7. Keep mainnet and supplier paid procurement disabled until the separate launch gates have evidence.

Tests validate code and mock model responses, not live supplier delivery or mainnet safety. See MAINNET-READINESS.md.
