# AGENT-18 — Repository Architecture Writer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `README.md`
- `docs/ARCHITECTURE.md`

## Read-only input interfaces
- `Current code and generated API profiles`
- `Verified build/evidence manifest`

## Input contract

Diagram only actual FSM transitions and trust boundaries: wallet identity -> validated task scope -> real tools -> quote/approval -> ledger/fulfillment -> canonical witness verification. Planned treasury features drawn as planned, not operational.

## Exact deliverables
- Mermaid end-to-end/FSM/Gateway diagrams, user-provided rubric alignment and precise run instructions.

## Acceptance
- Badges only for verified status; no 100% coverage/zero-warning/security certification claim without evidence. User judging weights and prize must be marked awaiting official verification. No vendor references; no overclaiming autonomous real buys. Existing README preserved by reviewable focused patch.

## Verify command

```sh
node scripts/dispatch-validate.mjs --task AGENT-18
```

## Dependencies / blockers
- AGENT-19

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
