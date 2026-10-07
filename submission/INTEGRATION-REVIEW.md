# Integration review — release candidate, not Mainnet clearance

Owner reports for twenty workers are implementation reports, not a release certificate. The integration review found:

- The former master smoke command ran security/dead-code **self-tests**, selected backend tests only, and silently omitted missing suites. It did not prove a clean repository. The replacement runs actual repository/history/bundle scans, every backend and web test, docs tests, backend/web typechecks, production builds and contract invariants. Missing steps fail.
- The actual initial scan found **175 identity-policy findings**, including legacy sources, generated bundles and a historical commit message. No credential findings were reported by that heuristic scan. This is a release blocker, not a clean audit. A source cleanup does not erase historical blobs; no force-push/history rewrite is authorized by this review.
- The worker receipt verifier accepted an address-only native fallback without checking value. It now distinguishes native vs ERC-20 assets explicitly, verifies exact amount/decimals, both transactions and receipts, canonical blocks at height, distinct configured endpoint hosts, and at least two confirmations. Distinct hosts are not proof of independent corporate operators.
- Ledger intent uniqueness now uses exact unique database keys inside the same immediate transaction as the journal, rather than substring matching outside the write transaction. Semantic gates apply to postings that supply an intent; detecting truly unobserved transactions still requires external reconciliation.
- Shadow replay is dry-run by default. Live adapters require explicit sender/recipient and atomic claim/reserve ports. Unknown broadcast outcomes retain their claim and are not relabelled as successful simulations. Only verified, nonsynthetic, explicitly consented records are traction-eligible.
- Imported traction reports check explicit consent, proof metadata and transaction deduplication. They remain **structural imports**, not fresh chain verification. Use the read-only verifier and original records before submission.
- Treasury math is planning software, not a deployed USYC investment/redemption integration. Contract tests are local tests, not an independent audit or deployment proof.

## Safe verification

```sh
cd backend && npm run check
cd ../web && npm test && npm run build
cd .. && node scripts/smoke-test-all.mjs
node scripts/live-readiness.mjs
# Optional existing owner-approved receipt input; never sends funds:
node scripts/live-readiness.mjs --evidence work/receipt-input.json
```

Receipt input contains only public transaction hash, sender, recipient, exact integer `expectedAmountMicro` and optional `assetKind`. Never put signing keys or supplier credentials in evidence files. Configure two HTTPS RPC endpoints privately through `ARC_RPC_URL` and `ARC_SECONDARY_RPC_URL`.

## Gates still requiring real evidence

1. Resolve current-tree/bundle identity findings and decide how to handle historical exposures.
2. Supply independently operated RPC configuration and verify an existing genuine settlement receipt.
3. Run the authenticated wallet/deposit/operator/order/recovery lifecycle with a consenting owner. Unit-test fixtures do not count as that live journey.
4. Obtain business pilot consent and operational records; measure real results separately from synthetic replay. Pilot counts and live revenue remain unasserted.
5. Confirm official hackathon requirements and current chain support from the organizers; rubric percentages are owner-supplied, not independently confirmed.
6. Sign off production fulfillment, funding reserve checks, reconciliation, refunds, monitoring and incident recovery. Mainnet remains closed.

The 10 USD procurement floor already has server-side freshness, held-reserve deduction and reopening hysteresis. New procurement is denied when its cost would breach the floor or the balance is stale/unknown. Paid/uncertain orders must retain their reserves and be reconciled rather than re-posted.

## Executed verification

See INTEGRATION-VERIFICATION.json for the actual local verification results. This uncommitted integration candidate is not deployed. Zero-warning lint is a separate strict gate; successful compilation does not satisfy it. Mainnet and commercial purchasing remain closed.

## Current privacy and Circle follow-up

The current source and regenerated bundle scope is recorded separately from historical Git identity findings in INTEGRATION-VERIFICATION.json. Lint rules have not been disabled. Read-only Gateway balance, canonical funding proof and unpaid x402 challenge do not constitute paid execution or an external business pilot. The original history has not been rewritten and the candidate is not deployed. Production requires the exact private supplier origin pin and vetted secondary RPC before backend release.

## Current privacy and Circle follow-up

The current source and regenerated bundle scope is recorded separately from historical Git identity findings in INTEGRATION-VERIFICATION.json. Lint rules have not been disabled. Read-only Gateway balance, canonical funding proof and unpaid x402 challenge do not constitute paid execution or an external business pilot. The original history has not been rewritten and the candidate is not deployed. Production requires the exact private supplier origin pin and vetted secondary RPC before backend release.
