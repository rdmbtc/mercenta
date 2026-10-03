# Mercenta — commerce treasury with checked agent actions

Mercenta helps a digital-goods reseller plan bounded purchases, separate procurement cost from resale margin, and inspect USDC payment evidence. The model chooses typed tools; deterministic policy checks; the owner either confirms the exact test quote or explicitly delegates one bounded test purchase.

## Business Operator

Open Assistant for goal → verified balance/budget → catalogue search → available options → server quote → permitted test order → saved non-redeemable delivery. Review is the default; optional delegation requires a one-order, amount/quantity/region/reserve-limited permission expiring in ten minutes. No real supplier invoices, mainnet or live goods. [Operator boundaries and evidence](docs/agent-operator.md).

## Live entry points
- App: https://app.mercenta.xyz/agent
- Guided commerce: https://app.mercenta.xyz/demo
- Documentation: https://docs.mercenta.xyz
- Public funding proof: https://app.mercenta.xyz/circle/gateway-funding.arc-testnet.json
- Repository: https://github.com/rdmbtc/mercenta

## What is real, and what is simulated
| Area | Status |
| --- | --- |
| Arc Testnet agent funding | Real: exact 0.100000 test-USDC Gateway deposit, canonical receipts checked |
| Gateway funding gas | 0.003574125 test USDC, below the approved 0.020000 cap |
| Account balance and orders | Persistent SQLite ledger; digital-goods fulfillment is simulated |
| Circle x402 seller | Mercenta-owned margin scenario report, 0.001000 test USDC; explicit confirmation required |
| x402 paid execution | Do not infer a paid request from a quote, funded wallet or successful mock test. Inspect actual private payment evidence |
| Profit First | Declared inputs or separately verified test buyer payment; customer deposits are not sales |
| Profit vault | Arc Testnet contract deployed; owner wallet signatures required |
| Earn/APY, mainnet, live suppliers | Not enabled |
| Customer traction | Internal project funding/testing is not external business adoption |

The Circle signer is a separate **server-managed local EOA**, not Circle MPC or a noncustodial browser wallet. Server key holders have spending authority; backend limits are not onchain delegated authority.

## Architecture
```text
Wallet-authenticated app / Agent Chat
  -> bounded proposal and immutable quote
  -> exact owner confirmation
  -> policy + balance + recipient + network checks
  -> persistent authorization BEFORE transmission
  -> Circle Gateway x402 / Arc Testnet
  -> original-payment reconciliation + canonical receipt
  -> actor-isolated evidence and exact ledger entries
```
The self-hosted seller independently checks EIP-712 signature, network, recipient, exact amount and authorization validity. It reserves the nonce durably before settlement. Cached-result replay cannot initiate settlement; uncertain receipts are reconciled, never silently paid again.

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
