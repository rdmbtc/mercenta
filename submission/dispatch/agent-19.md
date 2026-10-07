# AGENT-19 — Release Verification Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `scripts/smoke-test-all.mjs`

## Read-only input interfaces
- `All four package.json scripts`
- `Read-only RPC and disposable SQLite fixture`

## Input contract

Sequential bounded child_process spawn with explicit cwd/argv; no shell command interpolation. Read-only RPC health is opt-in --online. Offline full test/compile/build run default, network evidence status separate. No live DB reads without owner-approved exported snapshot.

## Exact deliverables
- Machine-readable suite results, WAL integrity result, optional RPC chain check and final summary.

## Acceptance
- Any required failure/missing tool/timeout => nonzero; skips and unavailable online proofs never green verified. Runner never edits configs, deploys/contracts or submits transactions. Preserve individual exit codes; print no credentials. --self-test exit 0, integrated run accepted only after all dependencies pass.

## Verify command

```sh
node scripts/smoke-test-all.mjs --self-test; node scripts/smoke-test-all.mjs
```

## Dependencies / blockers
- AGENT-01
- AGENT-02
- AGENT-03
- AGENT-06
- AGENT-07
- AGENT-10
- AGENT-12
- AGENT-13
- AGENT-14

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
