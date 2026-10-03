# Owner-authorized micro-purchase: verified result

## Outcome and spending

The owner authorized **one real procurement attempt, at most 1.000000 USD in aggregate** and supplied a new dedicated key with a declared $1 limit. One merchandise order was sent; **actual verified spending: 0.019400 USD**. No second purchase, funding invoice, top-up or on-chain payment was created.

The purchased item was **EGP 1 amazon.eg gift card**, quantity 1, region EG. Its catalogue price was refreshed immediately before submission. The API first accepted the order with HTTP 202 / IN_PROGRESS / application code 1. Polling the original reference and order then returned SUCCESS. One full voucher was received and saved **encrypted on the owner server**, not published in logs, source or frontend. The voucher was not activated; usability upon redemption is not claimed.

The original order reported 0.019400 USD. Both the actual cash-balance decrease and the scoped USD account transaction matched that amount. Cash and available funds remained above the $10 operating reserve; overdraft was not counted as cash. Private identifiers, account balances, key identity and voucher material are excluded from this report.

## Authorization evidence: do not overstate the cap

The dedicated key's $1 limit was **owner-attested, not independently verified through the authenticated key-control plane**. The earlier key-control request returned HTTP 401; the diagnostic endpoint does not expose transactionLimit/transactionRemaining. No key cap was changed, reset or claimed independently verified.

The narrowly authorized owner probe used a private one-shot runner with a fresh 0.019400 USD price, an additional preflight ceiling of 0.050000 USD, quantity 1 and the owner-declared total ceiling of 1.000000 USD. The documented purchase request has no maxPrice field or immutable quote binding. A preflight price alone is not a guarantee against supplier price changes. Actual accounting now confirms the single completed purchase remained below the owner's ceiling.

**The reusable source transport still rejects paid calls without independently verified same-key cap evidence. Its guard was not weakened to run this owner-attested exception.** The private probe is not a customer checkout route or an enabled automatic fulfillment service.

## One-shot execution and delivery evidence

The original UUID reference and one-attempt claim were persisted in a separate SQLite database with FULL synchronization before the only paid POST. Subsequent runs cannot create another order: a fresh process rejected preflight with PAID_ATTEMPT_ALREADY_CLAIMED and attempts=1 after completion. A transport timeout would leave an unknown outcome requiring GET reconciliation of the original reference, not a replacement POST or reference.

Only filtered original-order GETs were used. Explicit unhide=true with original reference/order acknowledged receipt of this voucher; it was not applied to unrelated order history. Raw private evidence and voucher content are encrypted with the existing server delivery-encryption key. The production customer ledger was not edited.

The live request used the official camelCase shop payload, X-API-Key and JSON Content-Type. SDK automatic retries were not used. HTTP 202 was not treated as delivery. Financial completion was asserted only after SUCCESS, one unmasked voucher and matching order/cash/ledger amounts.

## Tests and deployment scope

The backend suite contains **219 passing tests**, including 27 owner-guard cases and 20 documented transport cases. Fixtures cover amount boundaries, fees, stock/reserve checks, durable single-attempt state, reference conflicts, timeout/restart behavior, encryption, application-vs-HTTP statuses, no paid retries, masked polling and explicit receipt. These tests use synthetic codes, not repeated real purchases. See the accompanying QA JSON for the latest run outcome.

The working backend remained on **Arc Testnet, chain ID 5042002**, with HTTP 200 health after the probe. Its protected environment file was unchanged. No production customer checkout wiring was deployed, no mainnet switch was made, and no customer funds were used.

## Remaining mainnet gates

A successful supplier procurement check is not a successful customer checkout or autonomous business traction. Before enabling real customer orders:

1. Connect the verified protocol to the server order lifecycle: immutable customer quotation, authenticated payment confirmation, durable supplier reference, asynchronous status reconciliation and encrypted owner-only delivery.
2. Obtain independently verified production key limits/scopes/IP restrictions and establish quote-change/failure/refund behavior. Rotate keys disclosed in chat and separate production keys from probes.
3. Enforce reserve-based sale availability on the backend, not only in UI, and test concurrent orders, restart recovery, unavailable stock, partial delivery and accounting failures.
4. Verify the intended production network/RPC/token/contracts actually exist and are supported. Configure production chain/token checks; do not merely relabel testnet as mainnet.
5. Resolve customer custody, withdrawals/refunds and liability boundaries; complete an independent financial/security review and an end-to-end customer checkout rehearsal before a separately authorized limited launch.

Earn, borrow and onramp integrations are separate release gates, not capabilities proved by this purchase. This owner-funded micro-purchase must not be represented as independent user traction.
