# Customer checkout: contract-tested lifecycle, production closed

## Completed in this change

The protected `POST /api/orders` now calls an asynchronous verified quotation path before persisting an invoice. The documented single-voucher adapter checks product type/required inputs, fresh denomination price, positive stock, quantity one, USD procurement cash, the $10 operating reserve and independently verified exact per-order key-cap evidence. It rechecks immediately before procurement. A changed price is not silently accepted.

The customer order passes its pinned procurement cost into the supplier adapter. The old guessed Bearer/snake_case purchase transport was removed: generic enable flags cannot activate it. References are deterministic keyed hashes bounded to the documented 40-character limit; already persisted references remain unchanged during recovery.

A durable SQLite claim precedes the only purchase POST. Reference/body fingerprints reject changed-body reuse; a per-key local aggregate ceiling remains 1.000000 USD. Transport errors, pending responses and lost replies never trigger a replacement POST/reference. Reading the original order remains possible in contract tests after spend-cap evidence expires.

A completed voucher must bind to the original reference, order, denomination, quantity, currency and quoted cost. Full-code receipt is explicitly filtered to that original order. Customer fulfillment waits for an exact matching debit in the scoped complete USD transaction page. Delivery content is encrypted. After settled debit and fresh cash verification, the matching procurement reservation is released. Wrong identifiers, changed charge, masked/missing codes, partial results and mismatched/incomplete accounting keep the outcome uncertain and funds reserved.

A proven refusal **before** the outbound claim moves a paid customer order to REFUND_REQUIRED and releases its bookkeeping reserve. This is a liability/workflow state, **not an executed customer refund**. Post-submission cancellation/partial failure is not assumed safe to refund automatically; it requires financial reconciliation/review.

The background reconciler isolates each row's error, releases its lease and continues processing other orders. Terminal customer orders are not incorrectly requeued by a late unknown result. Delivered order bookkeeping is idempotent, and only the authenticated owner can access the existing one-time reveal endpoint.

The documented `GET /accounts` envelope is supported by the procurement monitor using USD cash/available funds only, excluding overdraft. An absent/unverified balance contract remains closed; low/stale balance cannot authorize a new purchase. Readiness reporting also requires an actual ready execution port, not merely enable flags.

## Checks

- Full backend suite: **257 passed, 0 failed**.
- Backend TypeScript build: passed.
- New checkout/protocol-integration cases: **38**, entirely synthetic.
- Coverage includes protected HTTP invoice preflight and owner isolation; payment-finality checks; encrypted delivery; charge/ledger binding; concurrent fulfillment calls; reference conflicts; cancellation/partial/masked outcomes; stock/price/reserve failures; aggregate $1 limit; and persistent file-database close/reopen after a lost POST response.
- No extra real orders, customer payments, funding invoices or on-chain transfers were made by these tests.

The earlier owner-funded procurement probe remains the only real purchase: **0.019400 USD**. That proved supplier delivery/accounting, not customer checkout or real-business traction.

## Runtime and release gates

`DocumentedVoucherSupply` currently requires **NODE_ENV=test** in addition to explicit enablement and trusted cap evidence. `buildServer` accepts a server-code-only fulfillment factory for these integration tests; ordinary production startup does not install it. An HTTP client cannot submit enable flags, key-cap evidence or a supplier key to activate purchases.

Production intentionally remains closed: the application currently verifies Arc Testnet payments (chain 5042002). Real merchandise must not be issued merely because a valueless testnet payment passed. The production network/token/payment verifier, customer custody/refund policy and live financial limits must be reviewed together before replacing this gate. No mainnet identifier or production RPC is invented.

The source API's cap verifier still requires independently verified same-key evidence; the owner's attested probe-key cap is not substituted for that production evidence. Automatic key-limit resets and live key-management requests are not implemented. The adapter's exact-cap/one-unit/$1 ceiling is a deliberately narrow contract-test profile, not a general production purchasing engine.

No frontend real-purchase switch or testnet-to-mainnet relabel was made. The existing rehearsal stays simulated. Backend rollout must retain the protected environment and database, use an isolated smoke check, and retain the previous release for rollback.

## Remaining before real customer launch

1. Verify that the intended production network is available and supported; bind actual chain ID, RPC, token, merchant receiver and finality rules. Keep customer and procurement currencies/ledgers distinct.
2. Implement authenticated production cap/permission evidence, controlled key rotation and reconciliation of outstanding orders. Do not reuse keys disclosed in chat.
3. Complete retry-safe customer delivery and a reviewed customer refund/withdrawal execution path; REFUND_REQUIRED alone is not a refund.
4. Wire approved production catalogue quotes and checkout into the customer app without turning rehearsal test prices into real-goods prices.
5. Review concurrent reserve accounting, quote changes and adverse settlement cases independently, then authorize a separate tightly limited live rollout.

Earn, borrow and onramp remain separate integrations with their own product and financial gates. Green tests or a successful owner purchase do not enable them.
