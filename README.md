# Mercenta — bounded digital procurement on Arc

**An agent should explain what it buys, stay inside its authority, and leave a record you can check.**

Mercenta combines a digital-goods workspace, a bounded Testnet model/tool operator, Arc USDC payment references and embedded Circle Onramp Kit funding. The model proposes; deterministic execution controls decide whether the requested tool can run. Payment, supplier delivery and commercial traction are separate facts.

## Start here

- **Mainnet workspace:** https://mainnet.mercenta.xyz
- **Testnet operator:** https://testnet.mercenta.xyz/app?section=agent-chat
- **Marketing:** https://mercenta.xyz
- **Judge quickstart:** [submission/JUDGE-QUICKSTART.md](submission/JUDGE-QUICKSTART.md)
- **Current submission scope:** [submission/FINAL-SUBMISSION-DOSSIER.md](submission/FINAL-SUBMISSION-DOSSIER.md)

## Current execution boundaries

| Capability | Scope | What it does not prove |
| --- | --- | --- |
| Retail checkout | Arc Mainnet native-USDC transfer directly to merchant; supplier response required for delivery | Historical transfers did not invoke MercentaCheckout and do not prove autonomous agent execution |
| Mainnet Assistant | Catalogue shortlist and explicitly rules-based guidance | Not a connected AI model or unattended spending agent |
| Business Operator | Model-selected tools and bounded owner-authorized Testnet task | Test artifacts are not redeemable products; fixture probes are not customer traction |
| Add USDC | Circle Onramp Kit hosted widget after wallet sign-in; server-created sessions | Session creation/browser callbacks are not verified bank settlement or Mercenta account credit |
| Gateway / x402 | Testnet integration with separate paid-service lifecycle | Unpaid challenge or queued acceptance is not final settlement |
| Treasury / yield scenarios | Planning and prototypes with explicit limitations | No proven live yield or guaranteed return |

The published router contract and the live direct-payment retail path are distinct. Do not describe direct transfers as payments enforced by all five policy checks of a router. Native Arc transaction values use 18 decimals; USDC account records use exact integer micro-units (6 decimals).

## Mainnet evidence — provenance matters

The founder reports supplying the funds for a friend's purchase. We classify this as a **founder-funded assisted pilot**, not independently funded demand or verified B2B adoption. Two other references are internal owner probes. The actual invoice and delivery evidence still need inspection; a chain transfer alone does not establish a sale or fulfillment.

| Reference | Transaction | Classification |
| --- | --- | --- |
| Friend-assisted purchase reference | [0xaefe4925…](https://explorer.arc.io/tx/0xaefe4925160179f02222d4ccb23be28c93bc7c4c8c3a51cc101f474f157d99d3) | Founder-funded assisted pilot; invoice mapping pending |
| Owner Stars probe | [0xcf322d7d…](https://explorer.arc.io/tx/0xcf322d7d8049bbf7f11d6cde15d8c56bde4a81dade45a1201b41e4751662253e) | Internal probe |
| Owner voucher canary | [0xa5d03fd9…](https://explorer.arc.io/tx/0xa5d03fd92bab5961cdc2e2e35d273ccc8df0a45eb5245d3b657c0718c6c7439d) | Internal probe |

[Evidence manifest](submission/tameion-evidence.json) separates founder disclosures, chain observations and missing evidence. [Chain observations](submission/tameion-chain-observations.json) verify these historical references via one public RPC; they do not verify business identity, delivery or an independent customer relationship.

### Reproduce without sending money

```sh
node scripts/verify-tameion-evidence.mjs
```

Node 24 recommended. No private key required. The verifier checks chain ID 5042, successful receipts, exact buyer/recipient/value and canonical receipt blocks. It refuses mismatches; no transaction is signed or sent. An optional `ARC_EVIDENCE_RPC_URL` stays local and is not printed in the evidence report.

## Receipt and recovery behavior

- Capture the hash as soon as the wallet returns it; a hash is submission, not settlement.
- Save a pending order before contacting the fulfillment service.
- Never generate a voucher from a transaction hash or claim a top-up was credited after a provider timeout.
- Check delivery without creating another payment. Inspect the original hash/history before retrying.
- Export a redacted account receipt without activation codes or recipient handles. The export identifies its limits and is not an independent audit.
- Old browser records that lack provider provenance are treated as unconfirmed references rather than verified delivery. Browser storage is not a trusted ledger.

## Contracts and policy layers

- Router reference: [0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed](https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed#code)
- Merchant: [0x58863e4a739da0e62c2eba258b7783e95d5c48ce](https://explorer.arc.io/address/0x58863e4a739da0e62c2eba258b7783e95d5c48ce)
- ERC-20 USDC: `0x3600000000000000000000000000000000000000`

[MercentaCheckout source](contracts/src/MercentaCheckout.sol) defines EIP-712 quote binding, replay protection, pause controls, order/day limits, exact payment handling and payment/refund events. It explicitly treats stock, procurement cash and delivery as off-chain facts. Contract events do not verify delivery. Deployment/source verification is not an independent security audit.

[Testnet operator guide](docs/agent-operator.md) documents actual tool choices, task caps, saved-budget rechecks, remaining-balance floors, explicit delegation and cancellation/recovery. Claims about these controls must name the execution layer and network instead of assuming parity with direct Mainnet transfers.

## Circle integration

[Recorded internal x402 acceptance](docs/verified-testnet-x402.md) documents a completed owner-authorized 0.001000 test-USDC paid-resource request and nonce-matched Gateway settlement on 2026-10-07. This is useful technical evidence, not independent revenue or a fresh runtime check. Its payer was a local EOA, not Circle MPC.

[Recorded internal x402 acceptance](docs/verified-testnet-x402.md) documents a completed owner-authorized 0.001000 test-USDC paid-resource request and nonce-matched Gateway settlement on 2026-10-07. This is useful technical evidence, not independent revenue or a fresh runtime check. Its payer was a local EOA, not Circle MPC.

[Circle operations](docs/circle-agent-stack-operations.md) distinguishes configuration, funded balance, unpaid 402 challenge, paid execution and final reconciliation. [Onramp integration](web/src/app/api/onramp/sessions/route.ts) keeps session creation server-side. Hosted funding eligibility, identity checks, quotes, bank details and available methods come from the provider. Wallet funding is not Mercenta revenue and is not an account-ledger credit in direct-wallet mode.

## Development

Node 24 recommended. Do not expose .env, wallet keys, provider credentials or redeemable codes in Git, browser variables or demo recordings.

```sh
git clone https://github.com/rdmbtc/mercenta.git
cd mercenta/web
npm ci
npm test
npm run lint
npm run build
```

## Tameion progress and remaining proof

Recent work includes Mainnet workspace UI, wallet sign-in, embedded amount-free Circle funding, honest delivery-pending handling, exact amount records and redacted receipts. Existing Testnet operator and prototype work must be distinguished from new work during the event.

Next proof gates: inspect the real invoice with consent, record an authenticated deployed agent task, obtain genuine independent business use, and publish a real demo under three minutes. A script or synthetic recording does not replace customer evidence. Product/traction CLI updates do not replace the final submission.

No guaranteed profit, measured finality latency, audited-contract status or independent customer count is claimed here.
