# AGENT-12 — Fault Tolerance Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/resilience-chaos.test.ts`

## Read-only input interfaces
- `backend/src/services/resilience.ts`
- `backend/src/services/agent-operator.ts`
- `backend/src/services/circle-agent.ts`
- `backend/src/services/orders.ts`
- `backend/src/services/procurement-health.ts`

## Input contract

Injected RPC/model/Gateway/fulfillment ports; persistent temp DB; explicit failure checkpoints before/after durable reserve, send and receipt. Read existing persisted statuses/leases instead of inventing transitions.

## Exact deliverables
- Timeout/HTTP402/RPC outage/crash recovery tests, low-credit/stale-credit breaker and cancellation races.

## Acceptance
- Unknown settlement is quarantined/reconciled, never automatically resent or refunded; lease expiry is not proof of failure. Durable reservations retained for ambiguous sends, proven pre-send locks released safely. Same operation/reference ID on restart, no duplicated money movement. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/resilience-chaos.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
