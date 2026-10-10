# Mercenta External Earn v1

Earn is a **noncustodial external-provider entry**, not Mercenta customer custody, automatic investment or guaranteed interest. `/earn` shows verified current variable USDC supply APR for Aave V3 **Ethereum Mainnet (chain 1)** and a risk-confirmed link to the official Aave application. Users supply/withdraw and inspect their position there, signing with their own wallet. There is no embedded Mercenta deposit/sign/withdraw method or customer vault in v1.

## Actual yield source

Aave lending activity supplies the interest; Mercenta does not create an IOU or subsidize returns with owner funds/new customer deposits. Rates vary. Protocol/governance/oracle failures, issuer freezes, stablecoin depeg, access restrictions, gas costs and liquidity constraints can cause loss/delayed withdrawals. Capital and interest are not guaranteed; this interface is not an audit or investment recommendation. Eligibility and access follow provider terms and applicable jurisdiction. Do not bypass restrictions.

This is NOT native Arc yield, USYC eligibility or Circle Gateway interest. Existing Arc shop/Testnet balances, reserves and refund money are untouched. Ethereum USDC and ETH gas are required; no automatic bridge is enabled. Mercenta support handles Mercenta purchase refunds, not reimbursements for an external investment loss. No extra Mercenta fee is introduced in this version; provider/network rules and costs still apply.

## Verification and fail-closed behavior

- Official pinned address book: https://github.com/bgd-labs/aave-address-book/blob/6a83d11893d6687bf6b9fd091a2a5320b3e1966e/src/AaveV3Ethereum.sol
- Pool interface: https://aave.com/docs/aave-v3/smart-contracts/pool
- Execution: https://app.aave.com/

`GET /api/earn/market` is served by the Next.js server, not the order/payment ledger. It accepts no query/address/RPC inputs and uses two fixed HTTPS Ethereum RPCs, a shared block, chain 1, token/aToken/pool bindings, code presence/hash agreement, active/unpaused/unfrozen reserve configuration, current supply cap and observed liquidity. Rates are display-only integer-rounded annual supply APR, not future APY. Money values remain integer micro-USDC strings. The endpoint cannot sign or transfer assets. POST has no handler and remains blocked on the Mainnet host.

Observations expire after 30 seconds and the block must be <=120 seconds old. RPC failures/disagreement, stale data or blocked reserve remove the live continuation link; no stale/demo rate is substituted. Read requests are coalesced and cached for 15 seconds per server process. The provider performs its own final checks before any actual transaction; our observations never guarantee execution or withdrawals.

The evidence JSON records two matching live RPC observations without any financial transaction. Code hashes describe proxy runtimes, not audited implementations. No real deposit, receipt, withdrawal or realized customer earnings have been tested by this work.

## Future embedded integration

Requires separate product/legal acceptance, reviewed wallet flow and scoped approvals, fresh transaction simulation, user-confirmed amounts, canonical receipt reconciliation, wallet-owned aToken positions and live withdrawal tests. Bridging, automated allocation, borrowing, a managed vault and per-user realized-yield history are NOT implemented and must not be advertised as enabled.
