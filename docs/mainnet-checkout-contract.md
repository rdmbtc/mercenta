# MercentaCheckout: Arc Mainnet contract candidate

**Status: compiled/tested engineering candidate, not independently audited, not deployed and not connected to public payments.** Existing `MercentaProfitVault.sol` is a separate Testnet-only seller budgeting experiment (chain 5042002); it is unchanged and is not the production customer payment contract.

## Purpose and boundaries

`contracts/src/MercentaCheckout.sol` is a non-upgradeable payment router for Arc Mainnet chain 5042. It is not an AMM, escrow, autonomous refund vault, lending protocol, USYC adapter or proof of confidential execution. Claims of being safer than another protocol require independent evidence, not feature counts.

The token is pinned to official six-decimal USDC `0x3600000000000000000000000000000000000000`. Native USDC has 18 decimals; one micro-USDC is exactly 10^12 native base units. Quotes select either native or token payment. The merchant, per-order ceiling and UTC-day volume ceiling are immutable constructor parameters. The merchant for the intended deployment is `0x58863e4a739dA0e62c2Eba258B7783e95D5C48cE`.

## Order authorization

EIP-712 domain: `MercentaCheckout`, version `1`, chain 5042, the actual deployed router address. `Quote` contains `orderId`, `buyer`, `skuHash`, `quantity`, `unitCostMicro`, `amountMicro`, `assetKind`, `validAfter`, `deadline`, `nonce` and `signerEpoch` in that exact order. Signers can be EOA (canonical 65-byte ECDSA) or ERC-1271 wallets. A buyer must submit their own payment; a leaked quote does not let an arbitrary caller pull their allowance.

The on-chain amount is `ceil(unitCostMicro * 10900 / 10000) * quantity`: nine percent markup once per unit, **not** nine percent net profit. Quotes last at most five minutes, require the exact asset and amount, and bind one globally unique order and one buyer nonce. Buyers can cancel their own unused nonce; the owner or quote signer can cancel an unpaid order. Contract domain separation and the on-chain `OrderPaid` digest eliminate the need to attribute a plain historical merchant transfer to a newly created order.

`skuHash` must commit to server SKU/item/region/quantity using canonical encoding. It is not a bought key, credential, customer PII or raw delivery content. `OrderPaid` proves payment only, not procurement or successful fulfillment.

## Custody and manual refunds

Successful payment forwards funds atomically to the immutable merchant; normal operation leaves no funds in the router. It is not a prefunded guarantee of customer refunds. The buyer only approves the exact token order amount.

Only the governance owner can execute a manual partial/full refund for an already paid order, to its original buyer, in its original asset, and only up to the remaining paid amount. Token refunds pull funds from the merchant using a merchant-approved allowance; native refunds require the owner's exact transaction value. An agent/quote signer cannot refund. Failed transfers roll back refund accounting. Refunds stay usable during a sales pause. A salted/opaque support commitment is logged; never send support messages or purchased codes on-chain. Separate ordinary wallet transfers require separate backend reconciliation and are not silently recorded here.

Direct native sends are rejected. Accidental token transfers or forcibly sent native balance create no order/customer credit. Only the owner may recover such surplus to the immutable merchant. Mercenta Support must handle accidental-transfer cases manually; no automatic right to an on-chain refund is created.

## Governance and emergency controls

Deployment starts paused. Owner or quote signer can pause sales; only the owner can reopen them. A signer change requires an owner proposal, a 24-hour delay and activation. Activation increments the signer epoch, invalidates outstanding quotes and pauses sales. Governance transfer is two-step, and renouncing ownership is disabled to preserve emergency/manual-refund administration. There is no proxy, upgrade, arbitrary-call executor, general customer withdrawal, arbitrary token approval, delegatecall or unlimited agent-spending entry point. Limits count gross paid volume; refunds cannot recycle daily limits.

Use reviewed multisig governance and a separately protected quote-signing key. Signer compromise still allows fraudulent metadata/quotes inside immutable monetary limits; pause/revoke/rotate and off-chain incident response remain necessary. Governance controls emergency pause and refunds and is trusted, not eliminated by the contract.

## Backend typed-data bridge

`backend/src/services/mainnet-checkout-quote.ts` maps the existing server-owned retail quote into the exact Solidity `Quote` tuple. It binds a reviewed router address, durable buyer nonce, on-chain signer epoch and selected asset. `orderId = keccak256(UTF8(lowercase quote UUID))`; `skuHash = keccak256(abi.encode(string service UUID, string item UUID, string region, uint32 quantity))`, with UUIDs lowercased. Creation/expiry milliseconds are floored to Unix seconds for the uint48 fields. All amount calculations remain in integer micro-units. ABI parity and altered-domain/asset/nonce/region/epoch checks are automated. The bridge does not sign, allocate nonce storage, broadcast, verify router settlement or mount a public route.

## What remains before deployment and sales

- Confirm public governance, deployment and quote-signer addresses and explicit per-order/day ceilings. Private keys must not be put into the repository or chat.
- Review/integrate server quote signing, persisted nonce/order allocation, stock checks, USD 10 procurement reserve, order cancellation/pause automation and the actual contract address. The contract cannot read external inventory or procurement cash, and does not pretend that an oracle exists.
- Verify live Arc native/token aliasing, gas behavior, successful/reverted payment and manual refund semantics. Local Ganache uses an ERC20 mock and does **not** reproduce the native-USDC precompile or Circle policy/blacklisting behavior.
- Add a router-specific backend receipt verifier: exact successful transaction to the pinned deployed router, two canonical RPC receipts, minimum confirmations, exact `OrderPaid` order/buyer/quote digest/recipient/amount/asset and on-chain stored order. Reject forged logs, reorgs and receipts from other routers. Existing direct-merchant-transfer verification is not valid for this router.
- Complete durable one-attempt procurement, lookup-only uncertain recovery, customer-owned encrypted delivery, actual liability/revenue/refund bookkeeping and frontend wallet confirmation. No money is moved by the LLM.
- Independent contract audit, operational review, artifact/source verification and explicit deployment approval. A passing test suite is not an audit or production acceptance.

## Reproducible commands (from contracts/)

```sh
npm ci
npm run compile
node --test --test-concurrency=1 test/*.test.cjs
node scripts/prepare-checkout-deployment.cjs --config mainnet-checkout.pending.json --out checkout-unsigned.json
```

The last command **intentionally fails** while public role addresses and ceilings are unconfirmed. Fill a reviewed public config; the helper only emits unsigned creation calldata. `--online` adds fixed-URL read-only two-RPC chain/token/creation-gas checks, never signing or broadcasting. Compiler is pinned Solidity 0.8.28, OpenZeppelin 5.4.0, optimizer 200, Paris EVM. There is no dependency modification. ABI, creation bytecode and source digest are in `contracts/artifacts/MercentaCheckout.json`.
