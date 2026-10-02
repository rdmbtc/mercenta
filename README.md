# Mercenta — commerce treasury with checked agent actions

Mercenta helps a digital-goods reseller plan bounded purchases, separate procurement cost from resale margin, and inspect USDC payment evidence. The model proposes; deterministic policy checks; the owner confirms.

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


## Buyer onboarding and financial journal

Open Getting Started in the account workspace for the EN/RU buyer/reseller journey, then Budget, Shop, Orders and Financial Journal. Saved prepaid Shop caps are atomic; manual diary entries never change the ledger. Journal text is server-encrypted at rest. The educational coach shares question + numeric aggregates only after explicit consent and has no tools.

Source tests: backend 119, web 147, docs 27. New backend publication is currently blocked by VPS SSH timeout; AppRoute read-only catalog returned HTTP 403. UI previews are simulated and read-only during outages. Do not claim live journal persistence, AppRoute fulfillment or mainnet activation until verified. See submission/ONBOARDING-RELEASE.md and submission/MAINNET-READINESS.md.
