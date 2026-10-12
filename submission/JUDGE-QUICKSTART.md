# Mercenta — judge quickstart

## What to evaluate

A bounded digital-procurement operator on Arc, with an independently inspectable payment trail. The current mainnet retail checkout and Testnet model/tool operator are different execution paths; don't infer mainnet agent autonomy from a manual payment.

## 1. Mainnet retail and funding — no purchase required

Open https://mainnet.mercenta.xyz. Explore the catalogue and Assistant. Mainnet assistant guidance is rules-based. Add USDC opens a Circle-hosted widget after wallet sign-in; signing in is not payment. Do not submit payment or identity information just to evaluate the UI. Available funding methods and countries come from the provider. A session/widget is not a bank deposit receipt.

Checkout currently sends native USDC directly to the merchant, not through the published router. It stores the transaction hash before fulfillment. Missing delivery produces PENDING, never a generated voucher or fictional credited top-up. Pending status checks do not resend a payment. Account receipt downloads omit activation codes and recipient handles and explicitly identify their verification limitations.

## 2. Agent behavior — Testnet only

Open https://testnet.mercenta.xyz/app?section=agent-chat with your own wallet. Read the scope in docs/agent-operator.md first. Guests may draft; account tools require genuine wallet sign-in. Don't bypass authentication or seed a fake production identity.

An authorized task can read balance/budget, search and inspect actual catalogue options, obtain a pinned server quote, and execute at most one test order within explicit delegation. The delivered test artifacts are not redeemable goods. Demonstrate normal execution, a violated cap/reserve, a separate exact-quote review, and recovery of the original task. Model failures must remain blocked rather than masquerading as rules-based AI.

## 3. Reproduce the payment evidence — read-only

From repository root with Node 24:

```sh
node scripts/verify-tameion-evidence.mjs
```

No API secret, private key or signing permission is required. It checks the Arc chain ID, successful receipts, exact buyer/merchant/native amount and canonical block for three named historical transfers. Output is submission/tameion-chain-observations.json. A single public RPC is not an independent audit. It does not verify a customer's identity, an invoice, delivery, sponsor funding, or router policy execution.

Evidence classification is in submission/tameion-evidence.json: one founder-funded friend pilot and two internal owner probes. The invoice-to-transaction mapping requires the actual invoice; public social proof is a supporting reference, not independent market demand.

## 4. Source and test entry points

- web/src/components/product/MainnetCheckout.tsx: direct payment, pending delivery and no fictional fulfillment fallback.
- web/src/lib/mainnet-orders.ts: exact six-decimal records, legacy migration, redacted exports.
- backend/src/services/agent-operator.ts: Testnet authority; see docs/agent-operator.md.
- docs/verified-testnet-x402.md: recorded internal paid-resource acceptance and its attribution limitations. Historical acceptance is not proof of today's uptime or external business use.
- contracts/src/MercentaCheckout.sol: signed quote router; historical direct payments did not invoke it.
- docs/circle-agent-stack-operations.md: Gateway/x402 readiness versus paid settlement.

```sh
cd web
npm ci
npm test
npm run lint
npm run build
```

Tests are software evidence, not customers or revenue. Never paste .env, voucher codes or signing material into the submission. A real under-three-minute demo video still needs to be recorded and submitted with the final form.
