# AGENT-10 — High-Load SQLite Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/concurrency-stress.test.ts`

## Read-only input interfaces
- `backend/src/db.ts`
- `backend/src/services/orders.ts`
- `backend/src/services/catalog-test-checkout.ts`
- `backend/test/orders.test.ts`

## Input contract

25 concurrent real service requests, temporary on-disk SQLite database, separate connections/workers where supported, journal_mode=WAL and durable idempotency keys. Isolated no-network fulfillment ports.

## Exact deliverables
- Unique-order burst, same-key replay burst, conflicting payload and insufficient-balance race.

## Acceptance
- No extra debit, no negative balance, exactly one settlement per key, sum of reserves consistent, quick_check/integrity_check = ok; controlled busy retries bounded. Promise.all against one synchronous in-memory connection is not WAL stress evidence. Clean database after every run. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/concurrency-stress.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
