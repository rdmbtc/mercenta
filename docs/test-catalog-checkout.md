# Catalogue test checkout

Arc Testnet only. A real catalogue selection can be rehearsed without creating any real supplier invoice, order, charge, stock reservation, activation or top-up.

1. Browse Catalogue and select a region, option and quantity (1–10).
2. Sign in with your wallet. This is not payment. Fund the Mercenta test account through the existing verified Arc Testnet deposit flow; wallet funds are separate.
3. Request a server quote. The fixed rehearsal price is **1.000000 test USDC per unit**, independent of the supplier USD price. Quotes expire after five minutes; quote creation moves no funds.
4. Review the exact debit and check the explicit non-redeemable test-delivery consent. Confirm once. Saved Shop budget caps still apply.
5. View the saved `MCT-TEST-` artifacts immediately or later in Shop → Purchases → View test delivery. They cannot redeem any product.

## Safety and recovery

Server-derived actor and strict request schemas; trusted immutable catalogue snapshot; owner-scoped encrypted delivery; atomic order, double-entry debit and artifact persistence. No provider POST request is part of this flow. A repeated confirmation request returns the same order and artifacts without another debit, even after quote expiry. A quote cannot be consumed by a second request. Failed transactions roll back.

After a network interruption, retry the same request. The browser retains only quote and request IDs in session storage, not delivery artifacts or keys. If confirmation was already completed, it returns the saved receipt. Check Purchases before starting a different order.

## Images

The original saved HTML contained 24 local product references but no embedded image bytes. A subsequent user-provided public image URL allowed retrieval of all 23 unique referenced images. Twenty locally hosted platform artworks now cover recognized brands; unknown brands remain visibly illustrative. These are not exact SKU/denomination or stock evidence. See `product-artwork-import.md` for scope and exclusions.

## Motion

Short catalogue entrance and hover transitions, native drawer entrance, focus/hover/touch help tooltip, and OS reduced-motion support. Checkout controls are disabled while submitting; no moving confirmation target.

## Not enabled

Real supplier checkout/invoices, redeemable delivery, mainnet, live Earn and real-customer traction. A test receipt is not evidence of a real sale.

## Verified release

- Backend: 137 tests passed, production build and Circle operations typecheck passed; additive release activated after protected SQLite online backup.
- Web: 180 tests passed and production build passed; docs: 34 tests passed and production build passed.
- Deployed guest browser QA: 19 checks passed, covering desktop/mobile, light/dark, Russian/English, reduced motion, keyboard/touch tooltips, native drawer dismissal, no-wallet handoff feedback, documentation and absence of supplier names in visible customer UI.
- Public health returned 200; unauthorized delivery and confirmation requests returned 401.
- Financial success/retry/restart/rollback paths were tested in isolated databases. No production wallet session was impersonated and no production deposit or purchase confirmation was made during QA.
- The initial checkout QA predated the artwork import; see `product-artwork-import.md` for the subsequent platform-artwork release.

See `test-catalog-checkout-qa.json` for the scoped checklist.
