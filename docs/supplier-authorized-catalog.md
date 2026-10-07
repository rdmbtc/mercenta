# Authorized supplier catalogue — 2026-10-03 follow-up

This supersedes the access-denied blocker in [the earlier catalogue report](./catalog-ai-refinement.md). It does **not** supersede procurement, mainnet or fulfilment release gates.

## Connected and deployed

- The supplied replacement credential returned **200** from `https://supplier.io/api/v1/whoami` and `/services`, using `X-API-Key` from the application VPS. `allowlistMatches` was true. The previously configured credential differed.
- Credential replaced atomically in protected server configuration only; private rollback copy retained. No key in the repository, frontend, public feed, source archive or installer payload.
- The authorized response contains **1,298 services / 7,554 options**. All response records are represented in `/api/catalog`, including **two services with no options**. No price or currency is displayed for missing options.
- Corrected validation for **362 nullable subcategory fields**, without weakening price/currency/stock validation or including private/unrecognized supplier fields.
- App browsing: **Shop → supplier catalogue**. Public browsing: [Mercenta catalogue](https://mercenta.xyz/catalog). Search product/option names, filter region and voucher/top-up/eSIM format, render 24 records initially and progressively load more. Public catalogue keeps its existing search/filter/detail and draft-only manifest controls.
- Actual supplier prices remain **USD**, not converted to USDC and not presented as Mercenta checkout quotes. Availability is feed evidence, subject to change; coverage remains `unverified`. This proves all records in this response were imported, not that undocumented pagination or the entire supplier universe was independently verified.

## Images — honest scope

The 29 image URLs in the authorized response point to country flags on `flagcdn.com`, not product photographs. Flags are not treated as product-cover artwork. Existing original local illustrations remain explicitly labelled **Illustrative cover**. No claim of official logos, branded product art or supplier-photo coverage.

## Verification

**126 backend tests** and **165 web tests** passed. Backend/web builds, TypeScript and Circle ops typecheck passed. Real authorized response validates successfully with 1,298 retained services before release. SQLite online backup/integrity check and rollback-protected service activation completed.

**30/30 live acceptance checks** passed with no JavaScript errors or financial mutation requests. Checks include exact feed counts, all source currencies, credential absence, 24→48 progressive rendering, search and eSIM filtering, 390/360px layouts, loaded visible cover, real Airalo options/details in USD, no purchase-confirmation action and Escape dismissal.

See [machine-readable evidence](./supplier-authorized-catalog.json).

## Still disabled / not tested

No supplier order, procurement, redeemable-code delivery, payment, transfer, mainnet or live Earn was activated or performed. Wallet-authenticated purchase was not tested during this follow-up. Feed credentials are not an authorization to spend; real order/fulfilment/refund/idempotency paths require their own verified integration and explicit confirmation. Model context no longer hard-codes catalogue access denial; model prose is still untrusted.

Credentials shared in chat should be rotated before real-money production use and entered through protected server configuration, not committed to source.
