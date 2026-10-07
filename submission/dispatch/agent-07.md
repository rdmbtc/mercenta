# AGENT-07 — Compliance & Risk QA Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/compliance-risk-tier.test.ts`

## Read-only input interfaces
- `backend/src/services/policy/index.ts`
- `backend/src/services/compliance-risk.ts`

## Input contract

Lead-owned decideRisk input: risk LOW/MEDIUM/HIGH/UNKNOWN, screeningId, observedAt, policy maxMicro/cappedMicro/delayMs, now. Output ALLOW/CAPPED_DELAY/BLOCK/ESCALATE with reason and immutable audit reference. Unknown/stale screening is blocked. Screening simulation is explicitly not sanctions clearance.

## Exact deliverables
- Risk-tier boundary tests, clock/delay/revision cases, transaction cap and append-only audit assertions.

## Acceptance
- HIGH/UNKNOWN cannot execute; MEDIUM needs cap+elapsed delay; LOW still obeys budget/reserve/signature policy. No automatic real sanctions clearance. Report missing production interface rather than validating a mock-only engine. Exit 0 after lead interface integration.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/compliance-risk-tier.test.ts
```

## Dependencies / blockers
- LEAD-COMPLIANCE-INTERFACE
- A production sanctions/risk-tier interface has not been found in the current service inventory.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
