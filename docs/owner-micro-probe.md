# Owner-authorized micro-purchase preparation

## Authorization and actual spending

The owner authorized a very small real procurement check. This work interprets the authorization conservatively as **one purchase attempt, no more than 1.000000 USD in aggregate including fees**, not an unlimited sequence of sub-dollar attempts.

**Paid requests sent: 0. Actual spending: 0.000000 USD.** No real order, funding invoice, top-up, fiat payment or on-chain transfer was sent. Mainnet and live customer fulfillment remain disabled. The new private helpers are not mounted on public routes or deployed as enabled customer checkout.

## Official protocol and actual read-only evidence

The owner supplied the official SDK and integration PDF. The SDK source was inspected at commit `404e98d37aa6fc0a212e875452ed64209be23bbf`; no vendor executable or package install was needed. Earlier unavailable documentation-host findings are superseded by the supplied repository/PDF.

The server-held key was recognized by the diagnostic endpoint (HTTP 200 / SUCCESS). Catalogue access returned HTTP 200 and 1,298 product groups. The documented `GET /accounts` returned a USD cash account with more than the $10 operating reserve; no overdraft is counted as procurement cash. No account identities, credentials or private activity were published.

A documented single-item GET returned a non-long gift-card denomination with positive stock and **0.019400 USD** price. This is a fresh catalogue observation, not an immutable checkout quote or completed purchase. No account-credential products were selected for procurement.

Documented merchandise purchase uses `POST /orders`, `X-API-Key`, JSON Content-Type, `ordersType`, original `referenceId` and exactly one `orders[].denominationId`. Funding invoices are separate balance top-ups and are not used in this probe. Order polling is filtered by the original reference/order. Normal GET leaves codes masked; explicit `unhide=true` with both original filters acknowledges receipt and is not applied to unrelated history.

The published SDK defaults to three HTTP retries and expects envelope `code/message`, while the supplied guide and observed API use numeric `statusCode/statusMessage`. The private transport therefore handles the observed envelope directly, with **no automatic paid POST retries**, strict response bounds and no redirected credential requests.

## Exact remaining blocker for the paid probe

The documented purchase payload does not expose `maxPrice` or a fixed final quote binding. The official SDK README/PDF describe an API-key cumulative `transactionLimit`, `transactionUsed` and remaining headroom; an exhausted cap rejects with HTTP 409, application code 13, not a retryable rate limit.

The current key can read catalogue/balances, but the correctly located authenticated control-plane key-record request returned HTTP 401. Its server-enforced remaining budget could not be verified. No key configuration was changed or fabricated.

To preserve the owner's hard $1 ceiling, use a **dedicated probe key** with `transactionLimit=1.00 USD`, no spending reset, only the required transaction/shop/orders permissions and the existing authorized procurement-server IP. Verify the key identity and remaining budget in the authenticated control plane. Do not expose the key in frontend, logs, repository or public documentation. The private transport rejects paid requests without fresh, same-key, normalized verified cap evidence of at most $1.

A listed price below $1 is not the same as a server-enforced spending ceiling. Do not infer price-lock support from optional amount fields or send undocumented cap headers. Do not increase a key's cap to make a failing probe pass.

## Tests and scope

27 isolated owner-guard tests cover an exact one-dollar boundary, fees/stock/balance evidence, one durable SQLite attempt, changed-reference conflict, timeout/restart without a replacement POST, encrypted delivery and binding to the item/quote/charge. 20 transport tests cover the documented camelCase request, key authentication, application-vs-HTTP statuses, accepted-but-incomplete results, no 409/502 paid retries, masked polling versus explicit receipt, response bounds and rejection of unverified or wrong-key budget evidence.

Full backend source suite: **219 passed, 0 failed**. Backend build and Circle-operation type check pass. All paid-path tests use fixture adapters and synthetic codes; they are not evidence of actual goods, successful real procurement or an independent security audit.

The generic live fulfillment transport was not enabled or claimed to have become production-ready. The fixed-quote owner state-machine helper and documented capped API transport are preparation components, not a completed live checkout wiring. A real probe needs the verified capped key and original-reference receipt/accounting evidence. Even a successful micro-purchase would not close custody, refunds/withdrawals, production chain/token configuration, credential rotation or independent-review gates for mainnet.
