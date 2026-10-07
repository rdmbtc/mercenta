# AGENT-20 — Submission Operations Manager

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `submission/FINAL-SUBMISSION-DOSSIER.md`

## Read-only input interfaces
- `Owner-supplied official form and event rules`
- `Verified deployment/evidence/build records`

## Input contract

Structured field -> draft answer -> evidence URL -> verification state. Repository https://github.com/rdmbtc/mercenta, main branch; app/docs URLs verified separately. Contract address/chain/deployment hash must come from canonical receipt and matching runtime bytecode, never a template.

## Exact deliverables
- Turnkey factual draft, evidence checklist, missing-input table and exact answer mapping only after form fields are received.

## Acceptance
- No automatic submission or invented form fields/contract addresses/businesses. Simulation separated from validated traction; all missing facts marked BLOCKED. No first-place guarantees; eligibility/prize/rubric verified against official rules before claim.

## Verify command

```sh
node scripts/dispatch-validate.mjs --task AGENT-20
```

## Dependencies / blockers
- AGENT-09
- AGENT-11
- AGENT-17
- AGENT-18
- AGENT-19
- Official form/rules, independently verified pilot evidence and release-specific contract deployment proofs required.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
