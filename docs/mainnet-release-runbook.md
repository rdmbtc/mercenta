# Mainnet release: prepare, prove, then enable

**Release state: PRE-LAUNCH / NO GO for money.** Network availability and a successful build do not prove real commerce works. No mainnet payment, real customer delivery or refund is claimed by this document.

## Verified network vs unfinished product

Arc Mainnet chain 5042 and two independent public RPC hosts are available. The official profile uses native USDC (18 decimals) and the ERC-20 USDC interface (6 decimals), which expose one balance: never add them. Gateway Wallet and Minter addresses are pinned in `production-mainnet.ts`, not copied from Testnet. Source references: [RPC endpoints](https://docs.arc.io/arc/references/rpc-endpoints.md), [contract addresses](https://docs.arc.io/arc/references/contract-addresses.md), [Gateway networks](https://developers.circle.com/gateway/references/supported-blockchains.md).

The operational backend still runs Testnet. Mainnet launch policy and receipt-verification modules are preparation, not wired production payment routes. The Mainnet web domain permits only four read-only metadata APIs. No browser switch changes a signer, carries a session or opens a financial route. The existing supplier adapter remains restricted to tests. Do not remove that restriction merely to obtain a green launch flag.

## Release owner checklist (every item requires dated evidence)

1. **Separate runtime:** dedicated mainnet service, origin-pinned backend proxy, exact host/cookie/session boundaries; all chain-dependent account, agent, Circle, settlement, profit and evidence services reviewed. No automatic Testnet fallback.
2. **Separate custody:** distinct signer, provider configuration, session/encryption/proxy secrets, Mainnet wallet addresses and least-privilege operator grant. Verify actual signer type and production entitlements. Never describe a local EOA as MPC. Store secrets outside the repository; redact keys, signatures, voucher contents and auth headers from logs.
3. **Separate accounting:** independent `mercenta-mainnet` DB namespace and WAL/SHM files; migrations on a restored clone; integer micro-USDC; append-only balanced journal with immutable order/quote/merchant/chain binding. Do not import Testnet balances. Verify account ownership at every order and delivery read.
4. **Fresh quote:** correct SKU, region, delivery fields, supplier USD cost, explicit margin and final USDC total; pricing expiry; one canonical idempotency reference; no USD display price interpreted as a payable quote.
5. **Reserve circuit breaker:** obtain fresh supplier balance including outstanding reserves. New procurement is blocked when the remaining balance after reserves and proposed cost is below $10, or balance is unknown/stale. Runtime policy, not frontend text, must enforce this. Existing order lookup, reconciliation and customer refund obligations stay available during pause.
6. **State machine:** `QUOTED → AUTHORIZED → PAYMENT_PENDING → PAYMENT_VERIFIED → SUPPLY_RESERVED → PROCUREMENT_SUBMITTED → DELIVERY_PENDING → DELIVERED`; failures have explicit cancellation/refund paths. Timeout after procurement submission enters `SUPPLIER_UNKNOWN`, retaining reserve and using lookup only. Never submit a new purchase on restart/retry. Persist attempt before external I/O. Partial delivery is not full success.
7. **Settlement:** match exact chain, sender, recipient, token and integer amount; two distinct HTTPS witness hosts agree on canonical block and at least three confirmations. RPC disagreement, pending receipt or malformed logs are not a successful payment. Receipt digest is integrity evidence, not a cryptographic signature by itself.
8. **Delivery:** fetch only the exact owned order, store code encrypted, mark retrieval deliberately, never expose full codes in public evidence. Verify delivered denomination and region. A simulated code is not a real item.
9. **Refunds:** reconcile failed/partial orders, execute bounded refund with an immutable reference, verify its receipt, prevent double refund; track outstanding liability during downtime. Do not turn off read/refund access together with new procurement.
10. **Operations:** encrypted consistent SQLite backup, recovery drill on separate service, integrity check and journal reconciliation, documented RPO/RTO, monitored RPC/provider/DB/backlog/reserve alarms, support owner and escalation rota. Back up before migration; rollback application without deleting settled orders or liabilities. Do not blindly roll back DB snapshots after funds move.
11. **Compliance/customer terms:** verified merchant/provider permission and sanctions workflow, privacy, cancellation/refund policy, non-withdrawable custodial balances disclosed if applicable. No Earn/Borrow/onramp availability claim without actual production access, geographic eligibility and permissioned-asset entitlements.
12. **Owner-only canary:** new explicit approval specifying Mainnet wallet, recipient, SKU, region, quantity one, exact price and all-in cost ceiling; provider-side spending cap verified. Maximum $1 procurement and maximum 1 USDC payment; gas separately disclosed and approved. Grant expires within 10 minutes. Abort on changed price, stale balance or insufficient $10 reserve. Prove payment → exact real delivery → accounting → refund path. Never repeat a possibly submitted request to "test again".

## Commands that do not spend

```sh
node scripts/mainnet-readonly-preflight.mjs --output work/mainnet-network-preflight.json
cd backend && npm test && npm run build
cd ../web && npm run lint -- --max-warnings=0 && npm test && npm run build
```

The preflight never reads secrets, signs or sends transactions. Its result certifies only observed network responses. `/api/mainnet-readiness` is a recorded preparation snapshot, not a live runtime health attestation or launch authorization.

## Rollout order

- Keep public payments closed. Deploy and validate the isolated runtime in closed mode.
- Complete restore, alarm, origin/session, reserve and unknown-order drills.
- Obtain fresh owner authorization for one bounded canary; do not reuse old Testnet permission.
- Review receipts, delivery and ledger with the owner. Only then consider a small allowlisted beta with explicit daily limits and monitoring.
- Public rollout requires independent security review and incident coverage. Pilot consent/logs remain separate from technical network evidence.

## Circle capability release gates

Gateway production requires pinned contracts, approved signer/payment configuration and reconciliation proof. Onramp requires configured merchant/provider eligibility and allowed countries. USYC Earn requires allowlisting and tested redemption/liquidity buffers. Borrow requires collateral, oracle/liquidation risk policy and actual provider access. Official chain support does not enable any of these in Mercenta. Keep all financial controls locked until their independent acceptance gates are satisfied.

Support: support@mercenta.xyz · [English updates](https://t.me/mercenta) · [Russian updates](https://t.me/mercentacis).
