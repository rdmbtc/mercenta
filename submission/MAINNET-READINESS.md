# Mercenta mainnet launch gates — NOT approval to launch

Current deployment: Arc Testnet chain 5042002. Simulated digital goods. Server-managed local agent EOA, not Circle MPC. supplier live procurement, real-goods sales, mainnet payments, fiat onboarding and withdrawals are not enabled. A deploy passing tests is not a financial security audit.

## Required before accepting real customer funds
- [ ] Verified official supplier API documentation and credentials via restricted server configuration; confirm permitted products/regions and procurement account balance.
- [ ] Implement the documented supplier adapter; do not assume the generic `/orders` transport is compatible. Validate authentication, stock, currency/FX, quote expiry, unique merchant reference, lookup, partial fulfillment, safe code delivery and refunds using sandbox fixtures and independent provider evidence.
- [ ] Separate procurement ledger, customer liabilities, supplier costs, platform margin, fees/refund reserves and wallet treasury. Deposits are liabilities, not revenue. Journal entries never become sale evidence.
- [ ] Paid fulfillment state machine: reserve → one supplier attempt with durable idempotency/reference → lookup on timeout → deliver verified encrypted codes or release/refund once. Never retry uncertain procurement by creating a new reference.
- [ ] Fresh production keys and least privilege; rotate every credential exposed in conversations. User must retain access; no silent credential changes. Separate testnet/production keys, database, origins, token contracts and allowlists.
- [ ] Confirm official production network/RPC/USDC semantics and explorer. Current testnet chain IDs, addresses and native-versus-ERC20 decimal handling must never be copied blindly.
- [ ] Independent review of contracts, signer custody, consent, allowances, authorization lifecycle, withdrawals and accounting reconciliation. Decide Circle-managed versus local custody explicitly.
- [ ] Backup/restore drill, disk/DB monitoring, fail-closed memory/outage behavior, alerting and operational runbooks. Temporary Redis/PostgreSQL are not balance authorities and may expire.
- [ ] Refund/cancellation/delivery policy, actual support contact, privacy/retention/deletion procedure and jurisdiction/compliance review for custody/digital-goods resale.
- [ ] Owner-approved small real transaction after the above gates; verify deposit, procurement, delivery, accounting, refund and withdrawal where offered. Record evidence before widening limits.

## Implemented preparation in this release
- Wallet-scoped onboarding, persistent budget planning with optimistic revisions, atomic prepaid Shop budget caps.
- Encrypted-at-rest private manual journal, explicit consent before model aggregate sharing, read-only educational coach with honest fallback.
- Public explicit blocked launch-readiness endpoint; no automatic mainnet switch or mainnet address assumptions.
- Testnet payment isolation, bounded x402 quote/confirmation/reconciliation and cached-only original-result recovery from previous releases.

## Go/no-go rule
**NO-GO until every applicable gate has evidence.** Do not claim supplier procurement, audited security, verified revenue, live yield or mainnet readiness from a demo UI alone.
