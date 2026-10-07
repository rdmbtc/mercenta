# AGENT-06 — Smart Contract Security Auditor

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `contracts/test/vault-invariants.test.cjs`

## Read-only input interfaces
- `contracts/src/MercentaProfitVault.sol`
- `contracts/artifacts/MercentaProfitVault.json`
- `contracts/test/vault-hardening.test.cjs`
- `contracts/test/MockUSDC.sol`

## Input contract

Use current compiled ABI and isolated Ganache chainId=5042002. Independent fixture in the owned test file. Use actual settleSale/withdrawBucket/claimProfit signatures. No public deployment.

## Exact deliverables
- Reentrancy callback, cross-owner withdrawal, zero address, arithmetic boundaries, rollback and bucket/profit liability conservation. Pause/unpause tests only if actual ABI supports it.

## Acceptance
- Adversarial token is a test-only source compiled in memory. Reject mutations without changing settlement markers, liabilities or balances. An absent pause API is a design blocker, not a passing fake test. No claim that local EVM proves public-network safety. Exit 0 for implemented acceptance suite.

## Verify command

```sh
cd contracts && npm run compile && node --test test/vault-invariants.test.cjs
```

## Dependencies / blockers
- Confirm pause/unpause ABI; do not invent contract methods.

Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
