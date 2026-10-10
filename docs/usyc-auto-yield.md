# USYC automatic treasury planning

**No real USYC subscription/redemption, deployed treasury vault, accepted custody adapter or promised yield is enabled by this module.** USYC is the intended token; it is not USDY or a hypothetical "USDYC". Eligibility, current NAV and actual redemption rules must come from the issuer and reviewed production adapters. Official Arc Mainnet addresses are pinned in `usyc-mainnet-registry.ts`; this does not verify investor or vault allowlisting.

`backend/src/services/usyc-auto-policy.ts` adds deterministic auto-planning for explicitly authorized **merchant-owned** capital. It is not authority to lend/invest customer deposits or balances owed under unpaid deliveries/refunds.

## Liquidity protection

Protected USDC = max(reserve floor, ceil(trailing 30-day burn × 14 / 30)) + gas reserve + outstanding customer liabilities + refund exposure + pending on-chain spending + obligations due before the configured redemption horizon.

Only the remaining settled cash is a subscription candidate. Per-cycle allocation and total USYC exposure caps apply. Slippage is bounded, NAV and observed cash expire after 15 seconds, and owner permission must remain valid. Invalid inputs, unsupported chains, incomplete liabilities, unverified provenance/issuer access/adapter or pending/unknown operations produce HOLD. A redemption request never becomes settled cash in the planner and never funds an immediate purchase by assumption.

The upstream procurement-account USD 10 floor is **separate** from this on-chain treasury USDC reserve. Do not conflate a fiat procurement balance with USYC liquidity. Costs, gas, issuer fees, variable NAV, market/rate risk and any unavailable or uncertain settlement mean neither 5%+ APY nor "not idle for one second" can be promised.

## Next execution boundary

- Confirm the issuer-approved wallet, jurisdiction/investor eligibility, network-specific token and subscription/redemption interfaces. Do not guess addresses or spoof allowlisting.
- Select a separately reviewed treasury custody/adapter contract and explicit owner authorization/limits. The checkout router only forwards sales; it must not start holding or investing customer funds.
- Derive a complete settled-cash/liability snapshot from actual production accounting, with reservations and manual refund exposure. The existing planning scenario is not such accounting evidence.
- Persist one original subscription/redemption intent before any external side effect, reserve its amount, then reconcile the original reference/hash on timeout/restart. Unknown outcomes block new allocation and keep reserves; never send another financial instruction just because a request timed out.
- Reconcile canonical subscription shares/redemption cash from two configured RPC observations before altering treasury balances. An outstanding redemption is not cash.
- Add an authorized scheduler and owner-visible monitoring only after the adapter has been accepted. All plans currently return `executionAuthorized:false`; there is no signing or broadcasting path here.

The new automated scenarios cover reserve floors, fourteen-day runway, customer/refund liabilities, stale NAV, pending outcomes, exposure ceilings, tiny amounts and deterministic balance conservation. They are synthetic tests, not yield income, real transactions or business traction.

## Separate Solidity treasury candidate

`contracts/src/MercentaTreasuryVault.sol` is an undeployed, non-upgradeable candidate, separate from the checkout router. It starts paused on chain 5042 and pins issuer-documented USDC, USYC and Teller addresses. Only owner-funded transfers enter its accounted cash; direct gifts/native sends are not credited for investment. USDC/USYC use six decimals.

- Only owner or scoped keeper can subscribe/redeem. The keeper cannot change risk accounting, attest eligibility, withdraw, change ownership or unpause. Keeper rotation/eligibility revocation pauses subscriptions.
- Immutable reserve floor, per-cycle and gross UTC-day subscription limits, maximum accounted shares, action IDs and 60-second action deadlines constrain operations. Redemption does not reset the gross subscription cap.
- Owner-recorded off-chain risk snapshots expire after 15 seconds. Additional protected cash must include full liabilities, refunds, pending spending, gas and upcoming obligations. **The owner is trusted to report these accurately; the contract cannot verify off-chain accounting completeness or investor eligibility.** Do not permit an LLM or public form to create these attestations.
- Exact allowances are cleared after Teller settlement. Actual cash/share balance deltas and caller-supplied minimum received amounts are checked atomically; a mismatch reverts the Teller call too. No claim of live slippage safety without verified NAV/limits.
- Owner redemption can be attempted while paused to support an exit; issuer policies still apply and may reject it. Cash is credited only after exact settlement. Keeper exits are blocked while paused.
- Only owner can manually withdraw cash to the immutable merchant, preserving fresh protected liquidity. There is no public customer deposit endpoint, no third-party beneficiary, no paid-order funding link and no arbitrary calls.

This vault can permanently strand funds if the issuer freezes/revokes access; it has no bypass for issuer compliance. Governance, NAV sources, snapshot producer, durable transaction outbox, signing custody and automatic scheduler are not live integrations. The Solidity candidate and planner are not yet wired together. Owner-only funding is a control, not a cryptographic proof that external money has no customer obligations.

## Official interface and read-only network evidence

Circle documents USYC subscriptions/redemptions as atomic T+0 through `deposit(uint256,address)` and `redeem(uint256,address,address)` when issuer access and execution conditions are satisfied. That does not entitle an unverified wallet/vault or make a pending/unknown operation spendable. USYC eligibility is restricted to eligible non-US entities and requires issuer onboarding.

Sources:
- https://developers.circle.com/tokenized/usyc/overview
- https://developers.circle.com/tokenized/usyc/subscribe-and-redeem
- https://developers.circle.com/tokenized/usyc/smart-contracts

`docs/evidence/usyc-mainnet-addresses-2026-10-10.json` records identical canonical block hash, code hashes and USYC decimals from two Mainnet RPCs. These addresses currently return short proxy runtimes; checking their code is **not** an audit of implementations, admin privileges or issuer eligibility. No funds moved. Investor/vault allowlisting remains unverified.

## Constructor and deployment prerequisites

Constructor: `(owner, merchant, keeper, reserveFloorMicro, cycleLimitMicro, dayLimitMicro, maximumShares)`.

USDC amounts and USYC share counts are distinct six-decimal integers. `maximumShares` is a share count, not a dollar exposure limit. The server must additionally enforce NAV-based dollar exposure limits. `dayLimitMicro >= cycleLimitMicro`; all immutable limits must be nonzero and approved before deployment. `mainnet-treasury.pending.json` intentionally leaves roles/limits unconfirmed; it is not deployable authorization.

Before funding: independently review the contract, issuer-controlled token/Teller implementations and governance, obtain issuer eligibility and allowlisting for the actual vault address, configure audited signing/custody and durable reconciliation, then approve a bounded real acceptance test. Never reuse the Testnet signer or transfer a customer balance. Owner attestation alone does not satisfy these prerequisites. No Mainnet transaction has been broadcast by this work.
