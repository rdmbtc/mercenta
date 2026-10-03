# Workspace UX redesign

## Essential task
Help a person choose a digital product, understand the account balance, and take one checked next step. This release changes frontend interaction and hierarchy, not settlement authority.

## Critical cuts
- Four primary destinations: Home, Shop, Wallet, Assistant.
- Purchase history stays beside Shop; Budget and Activity stay beside Wallet; Journal stays beside Assistant.
- Settings and Help are secondary. API access, Profit controls, business walkthrough and treasury lab remain reachable through the options menu and existing deep links.
- A native three-step setup replaces the seven-card text guide in the application. Documentation remains available separately.
- Developer x402 payments and journal entry/coach forms use progressive disclosure.

## Typography and layout
- Reuse the flagship landing's Geist/monospace pairing, charcoal materials, pale blue accent and architectural brand asset. No global landing changes or new remote imagery.
- One editorial home heading, a quiet account summary, recent purchases and one assistant next step. Unknown private values stay unknown; no invented chart or account history.
- Search, categories, region filter and exact-price sorting in Shop. Region filtering remains available on mobile.
- Native modal setup, visible keyboard focus, reduced-motion handling, responsive four-destination bottom navigation and existing light/dark/system preference.

## Functional boundaries
- Guest setup is a preview, not saved money. The in-memory budget preview can be continued in Budget. Only nonfinancial reviewed/role preferences are stored locally.
- Signed-in budget saves require the existing backend and use revision checking and stable request identifiers on retries.
- A guest can review a product but cannot confirm a purchase. Existing account debit, monetary limits, idempotency and wallet-signature boundaries are retained.
- Mainnet, redeemable AppRoute fulfillment, Earn/staking, fiat and cross-chain funding are not activated by this release.
- The VPS/API outage still blocks account loading, budget persistence and purchasing. A frontend deployment is not evidence of backend recovery.

## Verification
- Frontend suite: 151 tests passed across 18 test files; TypeScript and production build passed.
- New-module ESLint passed with no errors; unused Shop parameters were removed in final cleanup.
- Public guest UI QA and final deployment are recorded separately. No private account fixture should be presented as a real transaction or traction.
