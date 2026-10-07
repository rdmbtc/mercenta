# AGENT-01 — Financial Ledger Integrity Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/ledger-errors.test.ts`

## Read-only input interfaces
- `backend/src/services/ledger/index.ts`
- `backend/src/services/orders.ts`
- `backend/src/db.ts`

## Input contract

Use openDb(temp SQLite file), postJournal(db,id,witness,Line[]), balance and real order transaction gates. Line.amount is bigint micro-USDC; separate currencies. Seeded reproducible mutations. Read actual intent/witness contract before generating errors.

## Exact deliverables
- Six labelled scenario groups: omission; commission; principle; original-entry/replay; compensating error; complete reversal. At least one valid control per group. Persistent WAL fixture with cleanup.

## Acceptance
- Each malformed posting is rejected by the real semantic gate, not a test-local substitute. Balance, journal count and order reservation unchanged on rejection. Replay never creates a second debit. Test a balanced wrong-recipient posting and balanced reversal. No skipped/todo cases. Exit 0 required for acceptance.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/ledger-errors.test.ts
```

## Dependencies / blockers
- LEAD-SEMANTIC-LEDGER-GATE
- Current postJournal verifies witness presence and balanced sums, not recipient/classification intent. Six semantic protections must not be claimed before the lead adds a validated intent gate. The six-error taxonomy is user-supplied; attribution requires a verified source.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
