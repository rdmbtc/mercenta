# Morpho Arc: read-only research preview

Added alongside Aave Ethereum; no change to the original landing or financial runtime.

- GET `/api/earn/morpho` accepts no query inputs. Only three pinned Arc chain 5042 USDC vault addresses are read; discovery by name or highest APY is prohibited.
- RPC observations use two fixed endpoints and the same common block, compare block hash, runtime hashes, underlying asset, totalAssets, fee settings and four gate addresses. Stale blocks, disagreements, changed code, token mismatches or API errors fail closed.
- APY and withdrawal liquidity are **reported by Morpho API**, not independently verified calculations. Fetch time is not indexer freshness. API rate freshness is explicitly unverified. Runtime validation bounds size, rates, fees, token decimals, address sets and integer quantities. No hard-coded yield fallback.
- Snapshot expires after at most 30 seconds. Single in-flight request/cache per process; unsuccessful data is not recycled as fresh. Separate instances can still query upstream independently.
- Official app exploration needs fresh observations and risk acknowledgment. Only a pinned `https://app.morpho.org/` URL is opened, without pre-filled transactions. Customers must select Arc and verify the exact vault address. No wallet request, approval, deposit, redemption, bridge or signing endpoint exists here.
- Detailed allocation, collateral, oracle and governance review remains pending. No financial acceptance or independent audit is claimed. No highest-APY recommendation is made.
- Customer position is separate from commerce/prepaid balances. Principal and returns are not guaranteed, and protocol losses are not reimbursed by Mercenta.
- Full transactional integration would additionally need official Morpho attribution assets/terms review, wallet transaction review, actual deposit/withdrawal acceptance and jurisdiction/access review. This version is research metadata plus external exploration only.

## Sources

- https://docs.morpho.org/developers/contracts/addresses/
- https://docs.morpho.org/learn/resources/risks/
- https://docs.morpho.org/developers/earn/vault-ux/ux-requirement
- https://api.morpho.org/graphql
- https://github.com/morpho-org/vault-v2/blob/main/src/interfaces/IVaultV2.sol

Runtime pins are read-only observations from two Arc RPCs, not audited-code provenance proofs. Evidence is saved separately; do not confuse recorded evidence with current uptime.
