# Mercenta: demo closure and mainnet decision

## Current decision

**Mainnet: NO-GO.** Public readiness reports Arc Testnet (5042002), `mainnetEnabled: false` and `liveGoodsEnabled: false`. Do not activate real invoices, real supplier orders, live Earn or real-money checkout to meet a hackathon deadline.

The catalogue is browseable and platform artwork is available for matching brands. The test checkout is a separate flow: 1.000000 test USDC per unit, up to 10 units, with verified prepaid balance, explicit consent and non-redeemable saved test artifacts. Catalogue USD prices are indicative, not conversion or payment quotes.

## Business Operator implemented

Assistant now runs a model-selected catalogue/option/quote tool loop with review or explicitly bounded one-order test delegation. Durable task IDs, cancellation, lease/step limits, saved delivery and current budget/balance checks are enforced server-side. A live Groq + received-catalogue cycle passed against an isolated fixture ledger; it is not production execution or external traction proof. Details: `docs/agent-operator.md` and `docs/agent-operator-live-probe.json`.

Public Assistant guide source and build are updated. The earlier quota block was cleared by subsequent Vercel automatic publication from main; app and docs updates are now live. The app and backend operator releases are already active.

## Hardening release

Source tests pass: 172 backend, 232 web and 12 local-chain contract tests. New operator guidance is actionable and contextual; Finance exposes read-only SDK metadata and honest scenario/configuration boundaries. Procurement requires a verified fresh service balance, $10 post-order reserve, atomic outstanding holds and separately verified real fulfillment. None of this enables real invoices or mainnet.

The actual account endpoint did not expose the required procurement balance. Earn metadata discovery works, but code existence does not establish safe yield. Onramp credentials/route verification and a real Borrow market are absent. Complete those integrations only with evidence; do not convert tests into claims of live money management.

Latest backend hardening has a protected deployment and rollback path. New app/docs publication was subsequently verified live after Vercel picked up main. The guest guide was exercised on the deployed site; isolated mock QA remains separately labelled. See `docs/service-hardening.md` and `docs/service-hardening-qa.json`.

## Close the hackathon demo first

1. Rehearse a genuine owner-authenticated test purchase end to end: budget, verified balance, exact quote, explicit confirmation, saved test delivery and order history. Record errors/retry recovery honestly. Guest UI checks and local mocked financial tests are not proof of a signed-in production transaction.
2. For the Circle paid-service scenario, record owner confirmation of the exact 0.001000 test USDC quote, the returned service report and **final matching settlement evidence**. Queued acceptance is not settlement. Reconcile the original authorization; never create a replacement payment to hide a retry.
3. If showing Profit First, use a separately verified external buyer transfer and genuine owner signatures. Funding one's own account is not a sale. A margin scenario is not earned revenue.
4. Recruit a real external business pilot and capture their actual workflow, consented feedback and public existence proof. Self-wallet transfers, simulated goods and invented customer counts do not establish traction.
5. Record the final video under three minutes. Make the public repository, live app, documentation, network/wallet/contract addresses and scoped evidence easy to verify. Use the submission form and product/traction updates with accurate counts. Submit early; refresh the submission if stronger evidence arrives.

## Mainnet is a separate release, not a styling switch

- Implement and verify authorized real fulfillment: current stock/price mapping, idempotent procurement, timeout status lookup, partial delivery, refunds and cancellation policy.
- Set explicit production network/token/merchant allowlists and a fresh least-privilege signer. Separate production ledger/database from test data; reconcile deposits, liabilities, purchases and withdrawals.
- Rotate credentials exposed in chat or elsewhere. Complete independent financial/contract security review, backup-and-restore drill, incident monitoring and recovery procedures.
- Publish support/refund terms, privacy and jurisdiction-specific compliance requirements; assign an operator.
- Only after all gates have evidence: owner-authorized, tightly capped real-money pilot. No automatic migration or activation.

## Browse performance boundary

Immediate browse data is a dated, verified public snapshot, not current stock or payment authority. The complete searchable list is compact; selected options are fetched separately. A public-only cache can share catalogue data. Account balances, wallet auth, orders and financial confirmations must never use that shared cache.

References: `submission/READINESS.md`, `submission/MAINNET-READINESS.md`, `submission/DEMO-SCRIPT.md`, `docs/test-catalog-checkout.md`, `docs/product-artwork-import.md`, and `https://api.mercenta.xyz/api/launch-readiness`. Checklist items above are outstanding verification work, not claims of completed live transactions.
