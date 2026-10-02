# Tameion submission readiness

## Implemented and tested
- [x] Bounded commerce proposal, explicit simulated purchase confirmation, separate account/wallet balance.
- [x] Sale-linked Profit First flow with separately verified test buyer transfer; deposits are not revenue.
- [x] Deployed Arc Testnet profit contract with runtime pin; wallet signatures required for allocations.
- [x] Real 0.100000 test-USDC Gateway funding proof, exact gas and transaction hashes.
- [x] Mercenta-owned Arc Testnet x402 seller at exact 0.001000 test USDC.
- [x] Chat can prepare an idempotent paid-report quote but cannot submit it.
- [x] Seller independently checks signature/scope and reserves nonce before Gateway settlement.
- [x] Disk-restart test: one original authorization, one transmission, one ledger batch, original response recovered in cached-only mode.
- [x] Wrong actor, disabled configuration, memory pressure, malformed scope/signature and uncertain payment fail closed.
- [x] Backend 107 tests; frontend 142 tests; docs 27 tests. These include mocks, not live paid receipts.
- [x] Runtime audits: zero critical/high/moderate in backend/frontend, residual low elliptic propagation.
- [x] README, public documentation, under-three-minute narration script and read-only public verifier.

## Release gates
Run `node submission/verify-public.mjs` after publication. On the configured VPS, run `node --import tsx ops/hackathon-readiness.ts` from the backend directory using the existing server environment (do not export secrets to chat).
The operator check verifies the exact allowlist, unpaid 402, official Gateway Arc support, available Gateway balance and pinned profit-contract runtime. It creates no signatures/payments.

## Human/financial evidence still required
- [ ] Owner authenticates normally and confirms the exact x402 quote. Do not fabricate a wallet browser session.
- [ ] Actual service response and final nonce-matched Arc settlement recorded; queued is not settled.
- [ ] Actual buyer transfer and owner-signed sale-linked vault allocation recorded if used in the video.
- [ ] Final recorded end-to-end demo under three minutes. A read-only walkthrough/rehearsal is not proof of paid execution.
- [ ] Actual external pilot feedback/customer counts. Internal funding/self-hosted test requests are not traction.
- [ ] Disclosed credential rotation before production/mainnet launch; no independent security audit claimed.
- [ ] Final submission form, with the real team's identity/Discord and accurate traction figures. Do not invent missing identity or publish an unverified claim.

Public source repository: https://github.com/rdmbtc/mercenta . Publishing updates is verified separately from local commits.
