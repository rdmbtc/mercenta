# Mercenta — recording script (target 2m45s)

Use the real deployed UI. Do not edit a wallet-connected identity or inject an authenticated browser session for a recording. Never show private keys, provider credentials or raw signed authorizations.

## 00:00–00:20 — the business problem
“Digital-goods resellers see turnover but can accidentally spend procurement cash as if it were profit. Mercenta connects a checked commerce workflow with separate treasury balances and traceable payments.”
Show Dashboard / Guided Demo. State that digital-goods fulfillment is simulated in this testnet demo.

## 00:20–00:45 — intent becomes a bounded proposal
With the owner wallet authenticated, ask: “Plan a creator purchase under 2 USDC.”
Show pinned price, account balance and policy checks. Explain that a message never debits money. Execute a simulated purchase only through its explicit UI confirmation, then show its order and ledger IDs.

## 00:45–01:20 — Circle Agent Stack
Ask: “Prepare a paid margin report.” Show the exact 0.001000 test-USDC quote and recipient. Clearly label the service as Mercenta-owned, not a third-party customer.
Only the human owner clicks the exact-amount confirmation. Show the resource response. If Gateway is queued, say queued; show final Arc evidence only when reconciliation actually verifies it. A quote or Gateway deposit is not proof of paid execution.

## 01:20–01:45 — useful result and trust boundaries
Show the margin scenario: declared gross 2.000000, COGS 1.532000, other assumed fees 0.005000, paid report cost 0.001000, allocatable margin 0.462000 USDC. The 10% profit scenario is 0.046200 USDC.
These are scenario inputs, not verified customer revenue. Explain that actual sale-linked allocation requires a separate verified buyer transfer.

## 01:45–02:15 — Profit First
Show the sale-linked flow and exact contract allowance/owner wallet confirmation. Record a real allocation only if the owner signs it. Otherwise clearly show an unsigned proposal and do not imply funds were locked.
Explain: profit locking is not staking; live Earn/APY is not connected.

## 02:15–02:35 — retry safety
Show the automated disk-restart test and label it as a mock: one signature, one paid transmission, one ledger batch, cached original response recovered. Do not interrupt the production service just to manufacture a failure during recording.

## 02:35–02:45 — close with evidence
Show public funding proof, documentation and repository. State external pilot/customer counts from real evidence only. Internal project funding is not external traction.

## Recording gate
If the paid request, owner signatures or final settlement have not actually happened, use this script as a rehearsal; do not submit a video claiming those steps completed. A public read-only UI walkthrough is supplementary, not a replacement for the signed end-to-end demonstration.
