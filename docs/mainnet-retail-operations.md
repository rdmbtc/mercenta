# Mainnet retail release checks

## What is implemented

Mainnet wallet retail and Circle funding are separate from the Testnet agent ledger. Mainnet sourcing and Quick select use the current public catalogue and real denomination identifiers, not sample prices. Snapshot, stale or unavailable catalogue data cannot become a sourcing result. Checkout requires a wallet-bound server quote and checks the exact six-decimal amount before asking the wallet to pay.

The account history filters include all-time and custom UTC date ranges, product, status, country and initiator. Paginated records retain exact amounts. A pending delivery record is not a provider invoice or proof of redemption. Exports redact activation codes and recipient handles.

GET /api/mainnet/status composes current supply/inventory availability, fulfillment service health and retail proxy configuration. An operator can close new quotes with MERCENTA_RETAIL_PAUSED=true. An unavailable or stale health check blocks new quotes before payment. Service health is not proof that a supplier purchase will succeed.

Only implemented direct-top-up denomination routes are offered for Mainnet payment; unsupported options remain visible with an explicit no-payment notice. Payment-in-progress locks quantity, selection and dismissal. Failed or uncertain fulfillment retains the original payment reference; checking delivery must not send another payment.

Add USDC launches the Circle-hosted funding widget in the workspace after genuine wallet sign-in. The provider collects the amount, identity information and payment details. Direct-wallet deposits are not recorded as verified Mercenta account credits. A widget/session success is not evidence of a settled bank deposit.

## Mandatory operator gates

- Rotate and revoke the supplier credential involved in the earlier diagnostic exposure. Moving it to a private file was containment, not revocation. Install the replacement without exposing its value to logs, chat or git; review provider activity.
- Confirm a real signed-wallet checkout at the current exact quote, chain receipt, supplier reference and delivery outcome. Use a supported product and authorized funds. Do not count synthetic QA records as purchases.
- Confirm a real eligible Circle/BVNK deposit separately. Do not infer settlement from a browser lifecycle event alone.
- Attach a redacted actual provider invoice to the historical pilot evidence. Keep codes, PINs and recipient identifiers private.
- Describe the friend pilot as founder-funded external-user usage. Mainnet rules-based guidance is not autonomous Testnet agent execution.

These targeted controls are not a comprehensive security certification. Do not invite more buyers while the credential incident remains open.

## Software QA

From repository root, run `node --test deployment/mainnet-retail/service.test.mjs`. From `web`, run `npm test`, `npm run lint` and `npm run build`. Inspect desktop and 390px mobile sourcing, catalog options, funding, empty/error states and pending receipts. Signing and transaction methods must be disabled in synthetic browser QA.
