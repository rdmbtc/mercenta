# Mercenta — 20-worker bounded dispatch

## Status and authority

**BRIEFS PREPARED, NOT DISPATCHED.** This session cannot spawn independent AI subagents. This package specifies deterministic isolated work, not proof that workers ran. The lead remains responsible for UI and core orchestration. No automatic deployment or money movement is authorized by this package.

Pinned base: `585d4b4130292d2ae6424ecbd61db9de8524f12d`. Source inspection: backend uses node:test/tsx; web/docs use Vitest; contracts use node:test/Ganache. Current Home release tests were 270 web and 36 docs, not coverage percentages. Backend/contract results must be re-measured.

## Shared worker constraints

- No worker edits UI/CSS/styles, core orchestration, shared config, lockfiles, deployment or another worker target. Agent 14 may edit only its test.
- Separate checkout/worktree per agent, pinned base commit. No git commit/push by workers; lead integrates allowlisted diff only.
- No secret values in reports, mocks, commits or artifacts. No vendor plaintext; findings are redacted.
- No real funds, invoices, Mainnet or token-yield transactions. Testnet broadcasts require a separately approved scoped mirror run.
- Use actual runtimes: backend node:test via tsx; web/docs Vitest; contracts node:test/Ganache. No new dependencies.
- Runtime inputs fail closed and money uses bigint/string precision. Synthetic fixtures never count as traction.
- A missing production capability yields BLOCKED plus a reproducible failing test, not a green mock-only safety claim. No skip/todo acceptance.
- Tests must exit 0 to merge; security auditor must exit 1 on violations. Repository violations are not waived.
- User-provided rubric/prize/source attribution are unverified until official sources are supplied.
- Twenty briefs are not twenty running agents. No unavailable subagent/free-worker facility is simulated.

## Repository reality that changes the requested plan

- Ledger sums and witness strings alone do not prove all six semantic accounting errors are prevented. A balanced wrong-recipient or misclassified journal needs an intent-aware gate.
- Independent witnesses require distinct trusted evidence paths; two requests to one RPC do not qualify.
- The existing API profile has generic untyped response objects. Complete response-schema parity is additional engineering, not already done.
- Live treasury, sanctions clearance and a consenting business pilot are not established by fixtures.
- Agent 15 audits only; broad source cleanup is lead-owned to avoid merge conflicts.
- No first-place or prize guarantee. The judging matrix is provided by the owner and awaits official verification.

## Operating protocol

1. Assign a worker one brief and an isolated pinned checkout. It may read shared inputs but write only its allowlist.
2. Run deterministic offline tests with local temporary DBs. Never connect to the service production SQLite files or load deployment signers.
3. Return a diff, exact command/exit status, counts, evidence file digests, and blockers. No secrets or raw private operational invoices.
4. Lead reviews dependency contracts, financial boundaries and allowlist before merge. No cherry-pick of green mock-only proofs.
5. Canonical on-chain verification and consented pilots form a separate evidence run after approval.

## Result contract

`{agentId, baseCommit, state: PASS|FAIL|BLOCKED, changedFiles, commands:[{argv,cwd,exitCode}], assertions, evidenceDigests, blockers}`. PASS requires real production interfaces under test, exit 0 and no skipped acceptance. Documentation PASS means factual/source validation, not on-chain execution.

## Lead queue

- P0: read-only vendor/credential audit; evidence integrity; identify semantic ledger gaps. No deletion/history rewrite.
- P0: immutable, sanitized telemetry envelope from persisted operator state (no generated actions/receipt fields).
- P1: six-error intent-aware gate and dual-witness canonical verification; testnet replay only after reviewed ports.
- P1 UI: operator step/state motion using existing GSAP; accessible reduced-motion handling and explorer pills only for verified hashes. No page-router rewrite: app uses `web/src/app`.
- P2: consented pilot evidence, truthful CLI metrics, 165-second rehearsal and submission dossier.
- P3: treasury planning math, then eligibility-reviewed yield integration. No automatic USYC/mainnet activation.

## Waves

Wave A: 08,15,14,03,02,06,13,10 (independent read-only/testing/fixtures).
Wave B: 01,04,05,07,09,12 (after lead interface blockers are cleared).
Wave C: 11,16,17,18,19,20 (after evidence/tests exist).
No scheduling implies execution in this session.

---

# AGENT-01 — Financial Ledger Integrity Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/ledger-errors.test.ts`

## Read-only input interfaces
- `backend/src/services/ledger/index.ts`
- `backend/src/services/orders.ts`
- `backend/src/db.ts`

## Input contract

Use openDb(temp SQLite file), postJournal(db,id,witness,Line[]), balance and real order transaction gates. Line.amount is bigint micro-USDC; separate currencies. Seeded reproducible mutations. Read actual intent/witness contract before generating errors.

## Exact deliverables
- Six labelled scenario groups: omission; commission; principle; original-entry/replay; compensating error; complete reversal. At least one valid control per group. Persistent WAL fixture with cleanup.

## Acceptance
- Each malformed posting is rejected by the real semantic gate, not a test-local substitute. Balance, journal count and order reservation unchanged on rejection. Replay never creates a second debit. Test a balanced wrong-recipient posting and balanced reversal. No skipped/todo cases. Exit 0 required for acceptance.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/ledger-errors.test.ts
```

## Dependencies / blockers
- LEAD-SEMANTIC-LEDGER-GATE
- Current postJournal verifies witness presence and balanced sums, not recipient/classification intent. Six semantic protections must not be claimed before the lead adds a validated intent gate. The six-error taxonomy is user-supplied; attribution requires a verified source.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-02 — Cryptographic Protocol Security Tester

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/x402-security.test.ts`

## Read-only input interfaces
- `backend/src/services/circle-demo-seller.ts`
- `backend/src/services/circle-signers.ts`
- `backend/test/circle-demo-seller.test.ts`

## Input contract

Use CircleDemoSeller, sellerRequirements, AUTH_TYPES and injected SellerPorts. Locally generated test-only signing accounts. Match configured chain/domain/recipient and exact amount. Freeze clock and TTL from actual policy; do not assume every protocol authorization has a 10-minute maximum.

## Exact deliverables
- Valid authorization control and mutations for expired/not-yet-valid authorization, policy TTL overflow, nonce replay/race, domain/chain mismatch, wrong recipient/amount and tampered signature.

## Acceptance
- All invalid controls fail closed, zero settlement calls, unchanged durable nonce/account state. Valid control accepted exactly once. Network disabled. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/x402-security.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-03 — Catalog Data Architect

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/fixtures/catalog-expanded.json`
- `backend/test/catalog-expanded.test.ts`

## Read-only input interfaces
- `backend/src/services/catalog.ts`
- `backend/src/services/supplier-preview.ts`

## Input contract

Fixture v1: {schemaVersion:1,synthetic:true,network:"fixture",items:[{sku,name,categoryId,categoryLabel,regions,deliveryKind,baseCostUsd,markupBps,salePriceUsd,available,metadata}]}. Money uses canonical decimal strings (6 decimals), markup integer bps. Stable Mercenta-only IDs. Category IDs map existing gaming/streaming/creator/developer/cloud to the five exact labels in the dispatch contract.

## Exact deliverables
- At least 125 synthetic items, at least 25 in each category. Region/recipient requirements and denomination metadata; Zod validation inside the isolated test file.

## Acceptance
- Unique SKUs, allowed region enum, exact floor/ceil rounding policy, consistent cost+markup, no real credentials or fabricated live inventory. No catalogue bootstrap/source replacement. Zod rejects unknown categories, NaN, negative amounts and malformed region. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/catalog-expanded.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-04 — Traction Replay Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/services/shadow-mode-simulator.ts`
- `backend/test/shadow-mode.test.ts`

## Read-only input interfaces
- `backend/src/services/agent-operator.ts`
- `backend/src/services/arc/index.ts`
- `backend/src/services/operator-telemetry.ts`

## Input contract

simulateShadow(records,ports,policy): records include consented pilotId, sourceDigest, externalEventId, occurredAt, category, amountMicro as decimal integer string and currency. Default dryRun=true. Inject clock, durable idempotency store, plan/read functions and optional explicitly authorized TESTNET-only mirror adapter. No environment signer loading.

## Exact deliverables
- Deterministic normalization, duplicate handling, bounded mirror intents and audit records with SIMULATED / TESTNET_MIRROR / VERIFIED evidence classes.

## Acceptance
- Real operational logs require consent and minimization. Synthetic logs are marked synthetic and excluded from traction. No RPC sends by default; mainnet rejected; per-run cap+one-order ceiling+reserve floor enforced. Restart/replay cannot duplicate. Mirror hashes count only after canonical validation by 09. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/shadow-mode.test.ts
```

## Dependencies / blockers
- LEAD-TELEMETRY
- AGENT-09
- No supplied consenting business logs or verified pilot IDs. No permission to broadcast additional transactions in this dispatch.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

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

---

# AGENT-06 — Smart Contract Security Auditor

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `contracts/test/vault-invariants.test.cjs`

## Read-only input interfaces
- `contracts/src/MercentaProfitVault.sol`
- `contracts/artifacts/MercentaProfitVault.json`
- `contracts/test/vault-hardening.test.cjs`
- `contracts/test/MockUSDC.sol`

## Input contract

Use current compiled ABI and isolated Ganache chainId=5042002. Independent fixture in the owned test file. Use actual settleSale/withdrawBucket/claimProfit signatures. No public deployment.

## Exact deliverables
- Reentrancy callback, cross-owner withdrawal, zero address, arithmetic boundaries, rollback and bucket/profit liability conservation. Pause/unpause tests only if actual ABI supports it.

## Acceptance
- Adversarial token is a test-only source compiled in memory. Reject mutations without changing settlement markers, liabilities or balances. An absent pause API is a design blocker, not a passing fake test. No claim that local EVM proves public-network safety. Exit 0 for implemented acceptance suite.

## Verify command

```sh
cd contracts && npm run compile && node --test test/vault-invariants.test.cjs
```

## Dependencies / blockers
- Confirm pause/unpause ABI; do not invent contract methods.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

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

---

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

---

# AGENT-09 — On-Chain Evidence Specialist

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/services/receipt-proof-generator.ts`
- `backend/test/receipt-proof.test.ts`

## Read-only input interfaces
- `backend/src/services/arc/index.ts`
- `backend/src/services/orders.ts`

## Input contract

generateReceiptProof({hash,expectedSender,expectedRecipient,expectedAmountMicro,chainId:5042002,minConfirmations},ports): read-only ports getChainId/getTransaction/getReceipt/getBlock/getHead plus independent witness B. Verify native 18-decimal conversion vs ERC20 6 decimals separately.

## Exact deliverables
- Typed VERIFIED/REJECTED/UNAVAILABLE proof, stable evidence digest, markdown table with https://testnet.arcscan.app/tx/{hash}. No raw voucher data.

## Acceptance
- Reject revert, wrong chain/address/token/amount, missing receipt, mismatched block hash, reorg, insufficient confirmations, stale/disagreeing witnesses, duplicate hash. Two matching calls to one RPC are not independent witnesses. Explorer link alone is not evidence; no synthetic hashes in verified output. RPC failures never VERIFIED. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/receipt-proof.test.ts
```

## Dependencies / blockers
- Independent witness endpoints and trusted confirmation policy need lead configuration; absence fails closed.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-10 — High-Load SQLite Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/concurrency-stress.test.ts`

## Read-only input interfaces
- `backend/src/db.ts`
- `backend/src/services/orders.ts`
- `backend/src/services/catalog-test-checkout.ts`
- `backend/test/orders.test.ts`

## Input contract

25 concurrent real service requests, temporary on-disk SQLite database, separate connections/workers where supported, journal_mode=WAL and durable idempotency keys. Isolated no-network fulfillment ports.

## Exact deliverables
- Unique-order burst, same-key replay burst, conflicting payload and insufficient-balance race.

## Acceptance
- No extra debit, no negative balance, exactly one settlement per key, sum of reserves consistent, quick_check/integrity_check = ok; controlled busy retries bounded. Promise.all against one synchronous in-memory connection is not WAL stress evidence. Clean database after every run. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/concurrency-stress.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

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

---

# AGENT-12 — Fault Tolerance Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/resilience-chaos.test.ts`

## Read-only input interfaces
- `backend/src/services/resilience.ts`
- `backend/src/services/agent-operator.ts`
- `backend/src/services/circle-agent.ts`
- `backend/src/services/orders.ts`
- `backend/src/services/procurement-health.ts`

## Input contract

Injected RPC/model/Gateway/fulfillment ports; persistent temp DB; explicit failure checkpoints before/after durable reserve, send and receipt. Read existing persisted statuses/leases instead of inventing transitions.

## Exact deliverables
- Timeout/HTTP402/RPC outage/crash recovery tests, low-credit/stale-credit breaker and cancellation races.

## Acceptance
- Unknown settlement is quarantined/reconciled, never automatically resent or refunded; lease expiry is not proof of failure. Durable reservations retained for ambiguous sends, proven pre-send locks released safely. Same operation/reference ID on restart, no duplicated money movement. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/resilience-chaos.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-13 — API Contract Guardian

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/openapi-contract.test.ts`

## Read-only input interfaces
- `backend/src/routes/commerce.ts`
- `backend/src/routes/agent-operator.ts`
- `backend/src/routes/catalog-test-checkout.ts`
- `web/src/lib/openapi-testnet.json`
- `web/src/lib/openapi-mainnet.json`
- `web/src/app/api/openapi/route.ts`

## Input contract

Map actual backend and Next proxy methods, path params, Zod input constraints, auth and response status contracts. Distinguish account/operator routes from /api/v1 integration routes and mainnet-disabled profiles. Use generated artifacts, not assumed /api/quote aliases.

## Exact deliverables
- Operation parity matrix, strict input and response fixture validation, explicit exclusions with rationale for internal endpoints.

## Acceptance
- Mutation of a schema, method, required field or auth constraint makes suite fail. No assertion of 100% response typing while generic response objects remain untyped. Mainnet restrictions documented/tested; missing requested routes are blockers rather than fictional APIs. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/openapi-contract.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

# AGENT-14 — Accessibility & Keyboard QA Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `web/src/__tests__/a11y-keyboard.test.ts`

## Read-only input interfaces
- `web/src/components/product/StartJourney.tsx`
- `web/src/components/product/NetworkSelector.tsx`
- `web/src/components/product/AgentOperator.tsx`
- `web/src/components/product/AccountConsole.tsx`

## Input contract

Use project Vitest + jsdom + existing React createRoot/act test pattern (not Jest migration). Accessible name can come from label/text/ARIA; explicit aria-label is not mandatory where visible text correctly names the control. Native dialog showModal must be realistically modelled.

## Exact deliverables
- Tab/Shift-Tab traps, Escape/focus restore, keyboard form controls, tooltip focus activation and disabled financial controls.

## Acceptance
- No CSS/JSX/source edits, zero spending/auth/RPC calls, guest cannot invoke account tools, menu reachable at narrow layout. jsdom cannot prove pixels/real-browser focus; record required lead browser checks. Exit 0.

## Verify command

```sh
cd web && npx --no-install vitest run src/__tests__/a11y-keyboard.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

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

---

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

---

# AGENT-17 — Demo Narrative Director

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `submission/DEMO-VIDEO-TELEPROMPTER.md`

## Read-only input interfaces
- `App and capabilities manifest`
- `Verified evidence manifest and pilot consent`

## Input contract

165 seconds exactly; five requested timed segments. Record successful bounded goal -> plan -> approval -> observed action -> receipt; x402 EIP-712 authorization is not called a product quote signature without actual implementation.

## Exact deliverables
- Time-coded spoken script and screen-action plan, fallback marked TESTNET REHEARSAL when live evidence absent.

## Acceptance
- No edited fake balances/hash/counter, no unsupported live USYC or pilot claims; show blocked attempt and real tool events. Full 2m45s total, placeholders for unverified facts cannot become narrator claims.

## Verify command

```sh
node scripts/dispatch-validate.mjs --task AGENT-17
```

## Dependencies / blockers
- AGENT-09
- AGENT-11

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.

---

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

---

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

---

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
