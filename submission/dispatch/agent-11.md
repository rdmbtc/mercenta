# AGENT-11 — Hackathon Metrics CLI Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `scripts/traction-reporter.mjs`

## Read-only input interfaces
- `Consent-reviewed evidence input (owner supplies)`
- `Output contract from 04/09; no modification of their files`

## Input contract

Read a JSON evidence file; validate network/evidence class, consented unique business IDs, receipt verification and duplicate external events. Output payload and an argv array for update-traction/update-product; require verified installed CLI --help before asserting exact flag syntax.

## Exact deliverables
- Read-only JSON metrics report, testnet volume separated from revenue/live buying, command drafts only.

## Acceptance
- Synthetic/empty/unverified inputs never create pilot counts or volume. No credentials/private operational bills in report. No submission/API writes; no shell interpolation. Unknown CLI syntax labelled UNVERIFIED. --self-test exit 0.

## Verify command

```sh
node scripts/traction-reporter.mjs --self-test
```

## Dependencies / blockers
- AGENT-04
- AGENT-09
- Verified businesses/evidence and official CLI syntax have not been supplied.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
