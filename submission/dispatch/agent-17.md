# AGENT-17 — Demo Narrative Director

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `submission/DEMO-VIDEO-TELEPROMPTER.md`

## Read-only input interfaces
- `App and capabilities manifest`
- `Verified evidence manifest and pilot consent`

## Input contract

165 seconds exactly; five requested timed segments. Record successful bounded goal -> plan -> approval -> observed action -> receipt; x402 EIP-712 authorization is not called a product quote signature without actual implementation.

## Exact deliverables
- Time-coded spoken script and screen-action plan, fallback marked TESTNET REHEARSAL when live evidence absent.

## Acceptance
- No edited fake balances/hash/counter, no unsupported live USYC or pilot claims; show blocked attempt and real tool events. Full 2m45s total, placeholders for unverified facts cannot become narrator claims.

## Verify command

```sh
node scripts/dispatch-validate.mjs --task AGENT-17
```

## Dependencies / blockers
- AGENT-09
- AGENT-11

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
