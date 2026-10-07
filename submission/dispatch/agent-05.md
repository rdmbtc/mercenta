# AGENT-05 — Quantitative Treasury Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/services/treasury-yield.ts`
- `backend/test/treasury-usyc.test.ts`

## Read-only input interfaces
- `backend/src/services/app-kit/math.ts`
- `backend/src/services/app-kit/capabilities.ts`

## Input contract

forecastTreasury({cashMicro,burn30dMicro,obligations:[{dueAt,amountMicro}],now,redemptionDelayMs,safetyBufferMicro,eligibilityVerified,quotesFresh}): pure function, all money bigint internally, JSON outputs integer strings. Fourteen-day buffer ceil(burn30dMicro*14/30). Obligations due inside the redemption window are additional conservative reserves.

## Exact deliverables
- Runway (zero-burn represented explicitly, never Infinity in JSON), idle-surplus ceiling, ALLOCATE/HOLD/REDEEM planning decisions and UTC redemption deadlines.

## Acceptance
- Conservation, nonnegative balances, zero-burn/debt/late-obligation cases, boundary/large integers and conservative rounding. Unknown eligibility, stale quotes or uncertain redemption availability => HOLD. No approvals, mint/redemption transactions or guaranteed APY claims. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/treasury-usyc.test.ts
```

## Dependencies / blockers
- USYC access, jurisdiction, eligibility and redemption terms are not established; this task is planning math only.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
