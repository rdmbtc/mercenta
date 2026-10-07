# AGENT-16 — Pilot Handbook Writer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `docs/pilot-onboarding.md`
- `docs/shadow-mode-operator.md`

## Read-only input interfaces
- `Published app/docs behavior`
- `Evidence and capabilities manifest; outputs of 04/09 are read-only`

## Input contract

Audience: consented freelancers/agencies/digital shops. Explicitly separate their existing real banking workflow, read-only operational replay and optional testnet mirror. No private invoices or unconsented customer data.

## Exact deliverables
- Short start/stop guide, consent checklist, approval ceilings, data minimization, incident/revocation route and evidence interpretation.

## Acceptance
- No zero-risk guarantees, fake businesses, mainnet availability or production sanctions claims. Testnet tokens/codes are not money/products. Support uses support@mercenta.xyz. All steps map actual UI; unavailable features labelled planned. Readiness depends on verified pilot input.

## Verify command

```sh
node scripts/dispatch-validate.mjs --task AGENT-16
```

## Dependencies / blockers
- AGENT-04
- AGENT-09

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
