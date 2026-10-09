# Mercenta retail and availability policy

Owner-selected pricing: **9% markup on procurement cost**, not guaranteed net profit. A $10 cost becomes $10.90 before any separately disclosed network/payment fees. Retail prices use integer micro-units and round upward by at most one micro-unit. Eight to ten percent is the permitted configured range. Never apply the markup twice to a tagged retail feed or saved snapshot.

## Availability monitor

The read-only VPS service `mercenta-supply-monitor` polls documented USD cash/available funds every 15 seconds and catalog stock every 65 seconds. Parallel refreshes coalesce. It has its own Unix user, data directory and restricted env file. It does not import a signer, expose financial writes or call purchase endpoints.

- Available cash **<= $10**: new-order admission is paused.
- Available cash **> $10**: funding availability recovers on the next successful observation, without the former $12 recovery latch.
- Unknown, malformed, expired, wrong-currency or failed balance observations pause admission. Outstanding reservations still reduce usable cash, and the submit-time reserve gate protects existing orders.
- Out-of-stock denominations disappear; empty regional products disappear. A subsequent current positive stock observation restores them. Long-order availability is not invented.
- Failed/stale stock fetches are not served as current stock. Saved browse data remains explicitly unverified and is never payment authority.
- Pausing new orders does not disable authenticated existing-order reads, recovery or manual support/refund obligations.

Public HTTPS GET endpoints: `/commerce-read/health`, `/commerce-read/availability`, `/commerce-read/catalog`. They never disclose business cash balances or credentials. Every write is rejected. Frontend catalog and pricing use this feed; the Mainnet UI polls it instead of publishing an engineering release checklist to buyers.

Funding availability **does not automatically open a missing payment integration**. The availability response reports `realPurchasesEnabled:false` until a real production checkout exists. The protected Mainnet identity and Testnet runtimes remain separate and unchanged by this monitor. The one-order engineering canary quote uses the same retail markup policy, but its authorization and live acceptance gates have not been replaced with stock checks.

Refund requests go through Mercenta Support; only the owner issues refunds manually. No new purchase, payment or refund is performed by these monitoring checks. A production Mainnet recipient must be explicitly confirmed; the existing Testnet merchant address is not silently adopted.
