# Capital policy and blind execution — implementation boundaries

## Release scope

This release implements a planning-only capital policy, a software-isolated synthetic secret broker, authenticated lab endpoints and a secret-free procurement observation projection. It does not subscribe/redeem USYC, consume purchased credentials, call a real provider, debit funds, sign a payment or attest hardware.

## Capital contract

Canonical source: `backend/src/services/capital-policy.ts`. Frontend copy is byte-identical; run `node scripts/sync-capital-policy.mjs --check`. Backend parity tests reject drift.

Money is canonical, non-negative integer micro-unit text, with at most 18 digits. No floating-point arithmetic is used for balances. Timestamps must be safe integers. Duplicate obligation IDs are rejected. The policy protects max(reserveFloor, ceil(30-day burn × 14 / 30)) + order reservations + refund liabilities + liquidity buffer + obligations inside the configured redemption horizon. Upcoming purchases are protected before surplus calculation.

Do not feed overlapping liability categories into a future ledger integration. Do not add native USDC and ERC-20 views of the same balance. Do not treat incoming transfers, pending redemptions or a SETTLED label as cash without an actually reconciled cash snapshot. No USYC share-to-USDC 1:1 assumption is made; `yieldRedeemableUnits` represents an explicitly hypothetical or future verified USDC redemption quote, not token quantity.

Decision states: HOLD, PROPOSE_ALLOCATION, REQUEST_REDEMPTION, WAIT_FOR_SETTLEMENT, RECONCILE, MANUAL_REVIEW, LIQUIDITY_SHORTFALL, PURCHASE_READY_FOR_REVIEW. Every result remains `executionEnabled:false`, `moneyMoved:false`, `actualYieldUnits:null`, `aprVerified:false`. A frontend eligibility toggle is never actual investment authorization.

## Broker contract

- Owner: verified wallet actor through the existing timestamped HMAC backend proxy. No body-supplied owner is trusted.
- Grant: random UUID handle, a random 32-byte synthetic credential, AES-256-GCM ciphertext, ten-minute expiry and one-call allowance. Additional authenticated data binds Testnet namespace, actor, handle and operation.
- Root key: derived with a dedicated HMAC domain from the existing server encryption key; never a wallet private key. Stored envelopes are encrypted, not plaintext. Key rotation requires explicitly retiring/reconciling old capabilities.
- Tool: `demo.digest` only. Unknown fields including URL, headers, secret, shell and destination are rejected by strict input schemas. No external network egress exists in the default executor.
- Claim: persist RUNNING job and reserve the one-call allowance in one SQLite transaction **before** invoking the executor.
- Retry: unique (actor, requestId), body fingerprint conflict detection, completed receipt replay, RUNNING/UNKNOWN outcome never resubmitted. Unknown allowance is not released. Do not delete jobs to make a retry appear new.
- Output: only an opaque handle and bounded digest receipt; no raw executor errors or full credentials. Terminal receipts are immutable. Revocation removes ciphertext, not receipt history.
- Limits: twenty grants per owner per day, one call per grant, input text max 2000 characters. `quotaReservedUnits=1000` is synthetic compute allowance, not money.

The broker is a regular server process. Server admins, debugger access and a compromised trusted executor remain outside this software-isolation guarantee. Buffer clearing is best effort for owned buffers; it is not a proof that all runtime copies are erased. Cryptographic digests are not hardware attestations or independent proof of provider fulfillment.

## API

All endpoints below require verified wallet ownership:

- GET `/api/account/operator/lab/status`
- POST `/api/account/operator/lab/plan` — body `{snapshot: CapitalSnapshot}`, explicitly user-supplied scenario, not account balance
- POST `/api/account/operator/lab/blind/grants` — `{requestId, confirmSynthetic:true}`
- GET `/api/account/operator/lab/blind/grants/:id`
- POST `/api/account/operator/lab/blind/grants/:id/revoke` — `{}`
- POST `/api/account/operator/lab/blind/execute` — `{requestId, handle, operation:"demo.digest", input:{text}}`
- GET `/api/account/operator/lab/blind/receipts`

Mainnet middleware and backend proxy continue to reject these operations. Backend network selection remains Testnet-only.

## Before real adapters

Bind ingestion to an owned, verified paid order of a credential-compatible product; a game voucher is not an inference API key. Validate the provider and exact allowed operations, cap consumption, use provider-side limits, restrict egress and sanitize outputs. The LLM must never receive credential records or an unrestricted HTTP/shell executor. Real monetary metering requires proper ledger reservations, settlement and reconciliation, not the demo counter.

USYC needs verified entitlements, explicit authority, trusted pricing/redemption timing, actual receipt reconciliation and principal-vs-yield accounting. TEE requires real confidential infrastructure, remote attestation, image measurement, controlled key release and upgrade/revocation policy. Do not label an ephemeral container as TEE.
