# AGENT-04 — Traction Replay Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/services/shadow-mode-simulator.ts`
- `backend/test/shadow-mode.test.ts`

## Read-only input interfaces
- `backend/src/services/agent-operator.ts`
- `backend/src/services/arc/index.ts`
- `backend/src/services/operator-telemetry.ts`

## Input contract

simulateShadow(records,ports,policy): records include consented pilotId, sourceDigest, externalEventId, occurredAt, category, amountMicro as decimal integer string and currency. Default dryRun=true. Inject clock, durable idempotency store, plan/read functions and optional explicitly authorized TESTNET-only mirror adapter. No environment signer loading.

## Exact deliverables
- Deterministic normalization, duplicate handling, bounded mirror intents and audit records with SIMULATED / TESTNET_MIRROR / VERIFIED evidence classes.

## Acceptance
- Real operational logs require consent and minimization. Synthetic logs are marked synthetic and excluded from traction. No RPC sends by default; mainnet rejected; per-run cap+one-order ceiling+reserve floor enforced. Restart/replay cannot duplicate. Mirror hashes count only after canonical validation by 09. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/shadow-mode.test.ts
```

## Dependencies / blockers
- LEAD-TELEMETRY
- AGENT-09
- No supplied consenting business logs or verified pilot IDs. No permission to broadcast additional transactions in this dispatch.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
