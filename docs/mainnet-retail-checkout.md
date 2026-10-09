# Mainnet retail checkout integration checkpoint

The owner supplied this **public revenue recipient** on 2026-10-09:
`0x58863e4a739dA0e62c2Eba258B7783e95D5C48cE`.
It is pinned in the server-owned retail policy for Arc Mainnet (chain 5042). This is not an ownership signature, signer key, deposit instruction or proof of a purchase.

## Implemented library boundary

- Fresh server-observed voucher stock, region and USD cost; no required top-up fields.
- Nine percent **markup on cost**, rounded upward in micro-units once per unit. Retail USD pricing is accepted in USDC at the policy's explicit 1:1 pricing convention; not an FX guarantee or nine percent net profit.
- Balance observations expire after 15 seconds. Balance at or below USD 10 pauses new quotes. Concurrent holds preserve USD 10 after procurement costs, and cannot allocate the same observed stock twice.
- Five-minute immutable quotes bind customer, pinned recipient, SKU, region, quantity, chain, exact cost and sale amount.
- Separate WAL/FULL retail database; rejected shared staging/Testnet tables and namespaces.
- Two configured HTTPS RPCs must agree on successful canonical receipt, exact transfer and block timestamp, with at least three confirmations. Different hostnames alone do not establish independent providers.
- Retail verification supports amounts above USD 1; the legacy owner-canary verification remains capped at USD 1.
- A transaction mined before quote creation cannot pay it. Receipt hashes are uniquely attributed across retail orders. Incoming funds remain customer liabilities, never revenue before delivery.
- Expired quotes release unpaid holds; an observed late payment is recorded for manual review rather than silently discarded or automatically procured.
- These libraries never sign, transfer, call the supply purchase API, expose voucher plaintext, or issue refunds.

## Published read-only configuration

`GET https://api.mercenta.xyz/commerce-read/payment-policy` exposes the pinned recipient, chain 5042, nine-percent markup and manual-refund mode. It explicitly returns `paymentsEnabled: false` and `transferInstructionsAvailable: false`. HTTPS origin/CORS, no-store, write rejection and positive-only stock were checked on 2026-10-09. This route does not accept payments or create orders. The VPS read-only monitor source is `7d82fd45c14a1f22bafac06bfc3f7e5dd553b56e`; its focused tests passed 93/93, and the full sequential backend suite passed 573/573 with a successful build. See `docs/evidence/mainnet-retail-policy-2026-10-09.json` for the acceptance snapshot. The original flagship landing and Testnet runtime were not changed.

## Not yet connected to public commerce

No payment button, public quote/order route or purchasing worker is enabled by this checkpoint. The production adapter must bind authenticated Mainnet sessions to private live observations, persist a single procurement attempt before its POST, reconcile ambiguous outcomes by lookup only, seal delivered codes separately from LLM context, and book delivery/revenue atomically. Customer-owned order retrieval, monitoring, manual support and refund review must remain available while new sales pause.

Direct top-ups and eSIM products stay browse-only until their required fields and delivery contracts are implemented. Do not accept payments for unsupported product types. No actual Mainnet transfer, procurement or refund was performed to test these libraries. Synthetic fixtures are not traction.
