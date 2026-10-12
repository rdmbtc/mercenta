# Mainnet retail service

This is the sanitized source of the loopback-only fulfillment service. It is separate from the Arc Testnet agent ledger. Production path: `/opt/mercenta/mainnet-fulfillment/service.mjs`, service `mercenta-mainnet-fulfillment.service`, port `127.0.0.1:3016`.

## Authorization boundary

The browser calls same-origin Next.js routes, which validate the HMAC wallet session. The server sends `X-Mercenta-Retail-Proxy` and `X-Mercenta-Wallet` to the fulfillment node. Neither header is supplied from client input. The backend denies missing or wrong private credentials and wallet mismatches. History has no public all-wallet mode. Response caching is disabled.

Provision `/etc/mercenta/retail-proxy-key` and `/etc/mercenta/retail-supplier-key` as mode 0600 files owned by the service user; directory mode 0700. Set the same proxy credential as the server-only `MERCENTA_RETAIL_PROXY_KEY` Vercel production environment variable. Never use a NEXT_PUBLIC variable. No credential or redeemable code belongs in this directory or git. Rotate the former hard-coded supplier credential separately in the supplier console; migration to a private file is not revocation.

## Payment and fulfillment

A signed ten-minute quote is created only from recent live USD catalogue data, supported options, quantity and availability. Quotes bind wallet, SKU, quantity, recipient and exact six-decimal amount. Snapshot catalogues are browse-only. The browser stops before payment if the displayed amount differs or the server cannot mint a quote.

The backend verifies successful Arc receipt, merchant destination, transaction sender and sufficient native-USDC value before procurement. A SQLite `retail_claims` unique hash is inserted before supplier side effects. Failed or uncertain supplier responses retain that claim: retrying must not place another supplier order. Existing successful deliveries are returned only to their recorded owner. Pending recovery in the browser is GET-only.

Operators must reconcile an uncertain claim against provider reference and chain evidence; never delete a claim blindly or ask a customer to pay again. Claims are not a stock reservation, guarantee of provider delivery, refund mechanism or a full security audit. Concurrent fresh quotes can outlive changing stock. Native retail transactions still pay the merchant directly and are NOT router OrderPaid events or evidence of the complete agent policy engine.

Historical DB rows predate these guards; their presence is not independent proof of supplier delivery. No historical voucher seed is embedded in this source.

## Safe tests

`node --test deployment/mainnet-retail/service.test.mjs`

The test creates a temporary SQLite database, synthetic wallet/payment fixtures and disabled supplier networking. It executes no on-chain payment or real procurement. Cases cover public denial, wallet isolation, underpayment, malformed quantity/price, retained claims after failures, and owner-only cached delivery.

Before deployment, back up source and SQLite DB privately, verify source hash has not changed, run `node --check`, restart only this service and verify loopback health plus anonymous HTTP 401. Never redeploy signing keys or overwrite the supplier database as part of a frontend change.
