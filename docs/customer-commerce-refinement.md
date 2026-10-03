# Merchant customer-flow refinement — 2026-10-03

## Published

- Customer-facing catalogue, workspace, onboarding and current documentation use **Mercenta** rather than internal supplier branding. Public backend source metadata uses the merchant brand; public feed remains read-only.
- **Shop → Catalogue** is the default view. **Shop → Test purchase** is separate and has a working direct link. Real listings and simulated test goods are not presented as the same checkout.
- Product details now open directly inside the application, with region, delivery type, availability, options, quantity and an exact indicative source-currency total. The public catalogue shares this customer dialog. No raw JSON/code block is shown in the normal product-detail path.
- Developer draft controls are hidden behind an explicit Developer tools disclosure. Existing exact-currency draft exports remain for developers and are not orders or payment authorizations.
- The unavailable real-purchase state is explicit. No fake Buy action, provider order request, real-code delivery or mainnet activation was introduced. The test-purchase link is clearly labelled simulated.
- Shared drawers adopt active light/dark workspace colors; 390/360px layouts, Escape dismissal, source totals and separate simulation reviewed. Assistant facts distinguish connected real listings from a simulated-purchase flow.

## Images: verified limit, not completed

The supplied media-source credential worked for the documented catalogue API: **200**, **549 products**. The product list has no image fields or embedded image/asset URLs. One documented product/region detail request returned **200** and **12 variants**, also without image fields or asset URLs. Public homepage access redirects to sign-in and exposes no public product artwork.

No photos were imported or fabricated; existing covers remain explicitly illustrative. This does not prove that no media exists behind an authorized merchant account. Need a supported media endpoint or authorized export of assets/image URLs with product mapping. Do not merge provider IDs, regions or prices merely to obtain a cover.

Read-only API documentation used: [catalogue](https://letskeys.com/docs/catalog), [orders](https://letskeys.com/docs/orders). No paid order endpoint was called. The temporary media credential and probe responses were removed; it was never installed as a procurement credential or included in public source/artifacts.

## Verification

**127 backend tests, 168 web tests and 34 docs tests passed.** Builds/typechecks passed. Final public acceptance: **30/30** checks passed, no page errors and no financial mutation requests. Public merchant metadata retained **1,298 services / 7,554 options** and explicitly disabled purchasing. Human detail had no JSON, retained an exact **8.619000 USD** two-unit preview, could not execute a real purchase, linked to a separate **1.532000 test-USDC** simulation, and worked at 390/360px. Drawer theme matched the workspace.

A real guest-help request still returned **Groq**, `READ_ONLY`, zero plans. Its answer correctly said an actual digital code cannot currently be obtained. Model prose remains untrusted, not receipt evidence.

See [machine-readable checks](./customer-commerce-refinement.json).

## Main unfinished feature

**Real-product checkout/procurement is still not implemented and has not been chargeably validated.** Current generic supplier transport is not a verified production adapter. UI refinement does not change this fact. Next priority is the bounded real-order/quote/payment/delivery/refund path, not additional decorative polish.

See [commerce completion and hackathon priorities](./commerce-completion-plan.md) for contract validation, currency/markup policy, durable single attempts, UNKNOWN-state reconciliation, owner-only delivery, acceptance cases, external business pilot and submission evidence. No win or production-readiness guarantee.
