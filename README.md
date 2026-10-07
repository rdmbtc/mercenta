> **Testnet release:** one internal x402 payment is settled and independently rechecked against two canonical batch witnesses. This is not a production certificate or external business pilot. See [verified receipt](docs/verified-testnet-x402.md). Mainnet and commercial fulfillment remain closed.

# Mercenta — commerce treasury with checked agent actions

Mercenta helps a digital-goods reseller plan bounded purchases, separate procurement cost from resale margin, and inspect USDC payment evidence. The model chooses typed tools; deterministic policy checks; the owner either confirms the exact test quote or explicitly delegates one bounded test purchase.

## Business Operator

Open Assistant for goal → verified balance/budget → catalogue search → available options → server quote → permitted test order → saved non-redeemable delivery. Review is the default; optional delegation requires a one-order, amount/quantity/region/reserve-limited permission expiring in ten minutes. No real supplier invoices, mainnet or live goods. [Operator boundaries and evidence](docs/agent-operator.md).

## Live entry points
- App: https://app.mercenta.xyz/agent
- Guided commerce: https://app.mercenta.xyz/demo
- Documentation: https://docs.mercenta.xyz
- Public funding proof: https://app.mercenta.xyz/circle/gateway-funding.arc-testnet.json
- Verified internal x402 receipt: https://app.mercenta.xyz/circle/testnet-x402-acceptance.json
- Repository: https://github.com/rdmbtc/mercenta

## What is real, and what is simulated
| Area | Status |
| --- | --- |
| Arc Testnet agent funding | Real: exact 0.100000 test-USDC Gateway deposit, canonical receipts checked |
| Gateway funding gas | 0.003574125 test USDC, below the approved 0.020000 cap |
| Account balance and orders | Persistent SQLite ledger; digital-goods fulfillment is simulated |
| Circle x402 seller | Mercenta-owned margin scenario report, 0.001000 test USDC; explicit confirmation required |
| x402 paid execution | Verified internal request: 0.001000 test USDC, Circle transfer completed, canonical Gateway batch receipt checked via two RPCs. [Evidence and limitations](docs/verified-testnet-x402.md) |
| Profit First | Declared inputs or separately verified test buyer payment; customer deposits are not sales |
| Profit vault | Arc Testnet contract deployed; owner wallet signatures required |
| Earn/APY, mainnet, live suppliers | Not enabled |
| Customer traction | Internal project funding/testing is not external business adoption |

The Circle signer is a separate **server-managed local EOA**, not Circle MPC or a noncustodial browser wallet. Server key holders have spending authority; backend limits are not onchain delegated authority.

## Architecture & State Machine

See [Detailed Architecture & FSM Guide](docs/ARCHITECTURE.md) for the design model and integration limitations. The following end-to-end dual-witness flow is a target, not a claim that every deployed settlement uses it.

```mermaid
flowchart LR
    A[Agent Chat / Operator] -->|Bounded Goal| B[Policy Engine P1-P11]
    B -->|Intent Validated| C[Intent-Aware Ledger]
    C -->|Reserve Locked| D[Circle Gateway x402]
    D -->|Broadcast| E[Arc Testnet 5042002]
    E -->|Dual-Witness| F[Verified Canonical Receipt]
```

The self-hosted seller independently checks EIP-712 signatures, network, recipient, exact amount and authorization validity. It reserves the nonce durably before settlement. Cached-result replay cannot initiate settlement; uncertain receipts are quarantined as `SUPPLIER_UNKNOWN` and reconciled, never silently paid again.

### Accounting Protection & Canteen Framework
The candidate ledger tests six classical accounting-error scenarios when complete intent witnesses are supplied. Not every production posting supplies those optional witnesses; omission of an external transaction still requires independent reconciliation:
- **Omission, Commission, Principle, Original-Entry/Replay, Compensating, and Complete Reversal**.

### Hackathon Rubric Alignment
*(Note: Judging weights provided by project owner; awaiting official event verification)*
- **30% Traction**: Shadow-mode replay helper is tested; internal x402 receipt is live and reproducible. A consented external business pilot and its actual operation log are still required. Internal testing is not traction.
- **30% Agentic Sophistication**: Deterministic FSM, hardware-like boundary invariants, 6-error intent gate.
- **20% Circle Agent Stack**: Gateway x402 micropayments, EIP-712 auth, USYC treasury planning.
- **20% Innovation**: Autonomous digital commerce operator for keys, compute, and developer APIs.


## Run locally
Use Node 24 (minimum Node 22). Never put keys into chat, source, frontend environment variables or git.

```sh
cd backend
npm ci
# Copy .env.example to .env and configure local/server-only values.
npm run check
npm run dev
```
```sh
cd web
npm ci
npm test
npm run dev
```
```sh
cd docs
npm ci
npm test
npm run dev
```
Backend configuration, local EOA key files and model-provider credentials stay outside the public release. SQLite WAL is the primary store; temporary Redis/PostgreSQL services are optional and are not authoritative balances. Keep their explicit expiry and do not depend on trial availability.

## Acceptance and submission
See `submission/DEMO-SCRIPT.md`, `submission/READINESS.md` and the public Circle documentation. The demo must distinguish proposal, Gateway acceptance, final Arc settlement and useful resource delivery. Mocks prove code behavior, not live payments or external customers.

There is no independent contract/security audit. Backend and frontend dependency audits retain low-severity elliptic propagation; broader SDK branches need review before production use. Rotate credentials previously disclosed in chat before a production/mainnet launch.


## Buyer onboarding, agent and financial safety

The workspace groups Home, Shop, Account and Assistant. The bounded Business Operator can inspect funds and saved limits, search catalogue options, request a quote and complete an explicitly permitted non-redeemable test order. Interactive guidance and field help do not grant spending authority. Journal entries do not change the ledger.

Service hardening adds a fail-closed procurement reserve gate, atomic outstanding holds, invoice-before-payment protection and original-order recovery. The live procurement balance adapter and real fulfillment are not yet verified: real purchasing stays disabled. Finance provides read-only testnet Earn metadata, scenario calculations and an unverified Onramp gate, not enabled lending or investment.

Source checks: **172 backend, 232 web, 12 local-chain contract and 34 docs tests**. UI QA is isolated/mocked; no real funds were moved. These checks are not a financial/security audit. Latest app/docs were automatically published by Vercel from main; the live guest guide and updated docs page were checked. See [service hardening](docs/service-hardening.md), [release evidence](docs/service-hardening-qa.json) and [mainnet decision](submission/NEXT-STEPS.md).

## Recheck the settled Testnet receipt

After building backend dependencies, run `node scripts/verify-circle-testnet-receipt.mjs` from the repository root. This is read-only: it checks the nonce-matched completed Circle transfer and two canonical Gateway batch witnesses without signing or spending. The SHA-256 binding is not a separate digital signature; individual batch deltas were not independently decoded. [Exact results](submission/CIRCLE-TESTNET-ACCEPTANCE.json) · [Pilot consent template](docs/testnet-pilot-consent-template.md).
