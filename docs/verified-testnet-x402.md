# Verified internal Testnet x402 acceptance

Recorded 2026-10-07. Backend source release: `a579a182d38c099cd5b418c10524d67442d5241d`.

## What actually happened
One owner-authorized request to Mercenta's own `mercenta-margin-report` service consumed exactly **0.001000 test USDC** from the existing Circle Gateway balance. One new EIP-712 authorization was submitted. The seller returned HTTP 200 and the original nonce-matched Circle transfer reached `completed`. No new authorization or duplicate payment was created during reconciliation.

- Circle transfer ID: `0ef4c8be-0335-42d4-9fbe-ea286b3be458`
- Gateway balance: `0.100000` before, `0.099000` afterward (test USDC).
- [Canonical Arc Testnet batch transaction](https://testnet.arcscan.app/tx/0xef8037362a4b0e7f07b3c6d81b3327389b9271ab57fd7c5e537e4c7a578835b6)
- Two distinct Testnet RPC hosts agreed on the successful Gateway batch receipt and canonical block. Supplemental verification observed 129 confirmations.
- The journal has exactly one debit and one credit of 1000 micro-USDC; SQLite integrity is `ok`.
- The paid response was retained encrypted; the public receipt includes its digest, not its contents or the signed payment authorization.

The payer is the existing **server-managed local EOA**, not Circle MPC. The supplier origin pin and secondary Testnet RPC were migrated with a private environment backup; signer keys and unrelated environment settings were not changed. Real procurement and Mainnet remain disabled.

## Reproduce the read-only verification
From the repository root, with backend dependencies installed and built:

```sh
npm --prefix backend ci
npm --prefix backend run build
node scripts/verify-circle-testnet-receipt.mjs --integrity-only
node scripts/verify-circle-testnet-receipt.mjs
```

The first verification checks the evidence binding and exact balanced journal locally. The second queries the Circle nonce-matched transfer and both Testnet RPCs. Neither command signs, broadcasts, deposits funds or makes a paid request. Network outages and mismatches exit nonzero rather than claiming a verified payment.

Evidence files: `submission/CIRCLE-TESTNET-ACCEPTANCE.json`, `submission/PUBLISHED-TESTNET-VERIFICATION.json`. The receipt is also exposed as `/circle/testnet-x402-acceptance.json` on app and docs.

## Limits: do not inflate this result
This is **internal technical acceptance**, not an external business pilot, independent business endorsement, customer traction or real revenue. Individual settlement attribution combines Circle's nonce-matched transfer API with two canonical batch receipts; individual on-chain batch deltas were not independently decoded. Distinct RPC hosts do not independently establish administrative provider independence. The SHA-256 evidence digest is an integrity binding, not a separate digital signature.

A real external pilot still requires the participant's own consent and a genuine prospective operational log. Use `docs/testnet-pilot-consent-template.md`; do not sign it on their behalf. Old Git history was preserved by owner instruction, including the previously identified historical privacy finding.
