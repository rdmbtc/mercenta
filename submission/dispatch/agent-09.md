# AGENT-09 — On-Chain Evidence Specialist

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/services/receipt-proof-generator.ts`
- `backend/test/receipt-proof.test.ts`

## Read-only input interfaces
- `backend/src/services/arc/index.ts`
- `backend/src/services/orders.ts`

## Input contract

generateReceiptProof({hash,expectedSender,expectedRecipient,expectedAmountMicro,chainId:5042002,minConfirmations},ports): read-only ports getChainId/getTransaction/getReceipt/getBlock/getHead plus independent witness B. Verify native 18-decimal conversion vs ERC20 6 decimals separately.

## Exact deliverables
- Typed VERIFIED/REJECTED/UNAVAILABLE proof, stable evidence digest, markdown table with https://testnet.arcscan.app/tx/{hash}. No raw voucher data.

## Acceptance
- Reject revert, wrong chain/address/token/amount, missing receipt, mismatched block hash, reorg, insufficient confirmations, stale/disagreeing witnesses, duplicate hash. Two matching calls to one RPC are not independent witnesses. Explorer link alone is not evidence; no synthetic hashes in verified output. RPC failures never VERIFIED. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/receipt-proof.test.ts
```

## Dependencies / blockers
- Independent witness endpoints and trusted confirmation policy need lead configuration; absence fails closed.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
