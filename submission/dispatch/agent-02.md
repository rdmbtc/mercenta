# AGENT-02 — Cryptographic Protocol Security Tester

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/x402-security.test.ts`

## Read-only input interfaces
- `backend/src/services/circle-demo-seller.ts`
- `backend/src/services/circle-signers.ts`
- `backend/test/circle-demo-seller.test.ts`

## Input contract

Use CircleDemoSeller, sellerRequirements, AUTH_TYPES and injected SellerPorts. Locally generated test-only signing accounts. Match configured chain/domain/recipient and exact amount. Freeze clock and TTL from actual policy; do not assume every protocol authorization has a 10-minute maximum.

## Exact deliverables
- Valid authorization control and mutations for expired/not-yet-valid authorization, policy TTL overflow, nonce replay/race, domain/chain mismatch, wrong recipient/amount and tampered signature.

## Acceptance
- All invalid controls fail closed, zero settlement calls, unchanged durable nonce/account state. Valid control accepted exactly once. Network disabled. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/x402-security.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
