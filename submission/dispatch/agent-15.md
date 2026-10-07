# AGENT-15 — Code Health Audit Specialist

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `scripts/audit-dead-code.mjs`

## Read-only input interfaces
- `backend/package.json`
- `web/package.json`
- `TypeScript source and tsconfigs (read-only)`

## Input contract

Read-only dependency/export/unused-import findings; use existing tooling without installing packages or modifying locks. Classify definite vs potential findings, and return a patch proposal to the lead, not a broad cleanup PR.

## Exact deliverables
- Deterministic JSON/text report, reachable entrypoint handling and generated-file exclusions.

## Acceptance
- --self-test exits 0; unresolved definite problems give nonzero under --strict. No automatic deletions or unused-import edits outside ownership. No suppression of real warnings to meet a badge. Existing scripts do not contain a web check command; use actual build/lint scripts.

## Verify command

```sh
node scripts/audit-dead-code.mjs --self-test
```

## Dependencies / blockers
- The requested cross-repository cleanup would conflict with lead ownership and other agents; lead applies reviewed changes only.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
