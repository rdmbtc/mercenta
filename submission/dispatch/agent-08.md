# AGENT-08 — Information Security & Data Protection Guard

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `scripts/security-audit-vendor-leak.mjs`

## Read-only input interfaces
- `Tracked first-party source/docs/fixtures/lockfiles`
- `Git commit messages (read-only)`
- `First-party generated bundles under web/.next and docs/.next`

## Input contract

Zero-dependency Node CLI. Supported --self-test, --json, --history, --bundles, --root. Scan configurable deny terms without embedding forbidden plaintext in source; report only redacted path, rule ID and line. Heuristic hardcoded credential detection must distinguish public tx hashes/addresses and test-only generated fixtures.

## Exact deliverables
- Read-only source/path/message/bundle audit and adversarial self-test. No hooks, history rewrite, deleted files or automatic secret rotation.

## Acceptance
- Clean controlled fixture => exit 0; dirty controlled fixture => exit 1; unreadable scope/config => nonzero, never green. Self-test exits 0. The actual repository remains failed if legacy leaks exist; no allowlisting a forbidden adapter URL to get green. Never print secret values.

## Verify command

```sh
node scripts/security-audit-vendor-leak.mjs --self-test; node scripts/security-audit-vendor-leak.mjs --json --history --bundles
```

## Dependencies / blockers
- Legacy source, metadata and history may already contain forbidden references. History rewrite needs a separate explicit migration/coordination decision.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
