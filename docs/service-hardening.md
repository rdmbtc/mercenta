# Service hardening: scope and release boundaries

## Product changes

The Business Operator uses goal → spending boundary → review/result. A native-dialog, three-step guide fills only a sample goal and returns focus to the form. Accessible context help supports keyboard, hover and touch, clamps to the viewport and closes on Escape/outside interaction. Review remains the default. Delegation still requires the exact, separate one-order test authorization; guidance never authorizes execution.

Finance Hub removes invented treasury funds and fixed live-APY claims. Earn shows SDK-provided Arc Testnet metadata and a user-assumption calculator; Borrow is an offline risk scenario; Onramp reports protected configuration and refuses unverified hosted sessions. No live Earn, loan, fiat payment, swap or bridge execution was enabled.

## Procurement safety

The service procurement balance is NOT a customer's wallet or prepaid liability. Exact USD micros are used. Below $10 stops real purchases; a low-balance latch reopens only at $12 or above. A verified sample must be at most 30 seconds old (maximum five seconds future clock tolerance). Unknown, malformed, non-USD, unavailable and stale balances fail closed.

A configurable read-only adapter must return a strict normalized envelope: `{currency:"USD",available:"12.000000",observedAt:<integer epoch milliseconds>}`. The actual account probe returned no balance fields. No undocumented balance path was guessed or enabled. A verified provider endpoint/schema mapping is still required; the service currently reports real purchases paused.

Reservations are persisted atomically before an outbound real-order request. A task must leave at least $10 after its known exact cost. Concurrent attempts share outstanding reservations. Replayed references do not POST another order; conflicting costs reject. Uncertain/time-out outcomes retain their holds. There is no automatic release pretending that an uncertain invoice failed. Actual reconciliation and safe reservation release remain production gates.

Disabled funding/fulfillment is checked before creating a new legacy invoice or debit path. Existing order lookup/accounting recovery remains enabled when new procurement is paused. A generic transport is not a verified real supplier integration: `FULFILLMENT_CONTRACT_VERIFIED` defaults false. Real invoices remain off; no customer funds were used by this release.

The public service-availability response reveals status, not business balance or credentials. Catalogue browsing and the separate testnet rehearsal remain available. Maintenance copy does not conceal a confirmed charge or claim delivery.

## Verification

Source release: 172 backend tests; 232 web tests; 12 isolated local-chain contract tests; 34 docs tests. Backend/web/docs builds and Circle operation type checking pass. Isolated desktop/mobile UI QA: 27 checks, no production auth or payments. New tests cover reserves, stale/unknown funding, invoice blocking, idempotency, original-order recovery, help/guide accessibility, no fake finance state, SDK metadata whitelisting, rollback, exact rounding, fee-on-transfer rejection, reentrancy and partial claim cursor conservation.

The SDK returned two Arc Testnet vault metadata records. Read-only chain-ID and bytecode probes succeeded. Existence of code is not security, liquidity, yield or production suitability evidence. Public discovery excludes unverified APY and execution claims.

GitHub CI is prepared with pinned actions, read-only permissions and separate backend, contracts, web and docs jobs. It contains no deployment, mainnet activation or financial secrets. Local tests are not an independent security audit or proof that remote CI has passed.

## Publication and mainnet

The backend release is separately verified on the VPS. New app/docs sources and safe publication stages are prepared, but the latest Vercel daily deployment quota blocked publication; do not present local mocked previews as deployed UI.

**Mainnet: NO-GO.** Required evidence includes genuine authenticated owner checkout/retry delivery, actual provider stock/price/idempotent fulfillment and refunds, production network/custody allowlists, withdrawal/liability reconciliation, credential rotation, independent review, incident/restore drills and an owner-approved tightly bounded pilot. Real external business usage is needed for traction; self-funding and mock tests do not count.
