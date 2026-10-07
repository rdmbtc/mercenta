# Mercenta Shadow Mode Operator Guide

The Mercenta **Shadow Mode Simulator** enables autonomous agent operators and treasury managers to replay operational commerce streams in a deterministic, zero-risk environment before committing capital to on-chain settlement rails.

---

## 1. Architectural Overview

Shadow Mode sits between external business operations and on-chain clearing rails. It mirrors procurement demand through a stateful policy pipeline:

```
[Operational Event Stream]
          │
          ▼
┌─────────────────────────┐
│ Idempotency Deduplicator│  ──(Duplicate?)──► SKIPPED_DUPLICATE
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Consent & Schema Gate  │  ──(!Consented?)──► REJECTED_CONSENT
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Multi-Error Policy Gate │  ──(Limit Breach?)──► REJECTED_CAP
└─────────┬───────────────┘
          │
          ├──(Dry-Run Mode)──► Evidence: SIMULATED
          │
          ▼
┌─────────────────────────┐
│ Arc Testnet Mirror Port │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Dual-Witness Verifier  │  ──(Consensus Confirmed)──► Evidence: VERIFIED
└─────────────────────────┘
```

---

## 2. Key Safeguards & Operating Limits

### 2.1 Default Fail-Closed Posture
The simulator runs with `dryRun = true` by default. Under dry-run conditions:
- No network RPC requests are dispatched.
- No cryptographic signatures are broadcast.
- Output audit logs classify all executions as `SIMULATED`.

### 2.2 Boundary Limits
Every replay execution enforces three hardware-like boundary invariants:
1. **One-Order Ceiling**: Orders exceeding the maximum configured ceiling (e.g., 50.00 USDC) are blocked immediately (`ONE_ORDER_CEILING_EXCEEDED`).
2. **Per-Run Cap**: Aggregate spend across a single replay batch cannot exceed the run cap (`PER_RUN_CAP_EXCEEDED`).
3. **Reserve Floor**: The operator's working vault must maintain a mandatory minimum reserve floor (e.g., 10.00 USDC). Transactions threatening this floor are halted (`RESERVE_FLOOR_BREACH`).

---

## 3. Evidence Classification Schema

Every processed event outputs a deterministic audit record containing an immutable SHA-256 digest:

| Evidence Class | Network | Settlement Mechanism | Traction Eligibility |
| :--- | :--- | :--- | :--- |
| `SIMULATED` | Local Sandbox | In-memory policy calculation | **No** (Excluded) |
| `TESTNET_MIRROR` | Arc Testnet (5042002) | Broadcast pending receipt | **Pending Confirmation** |
| `VERIFIED` | Arc Testnet (5042002) | Dual-witness block hash consensus | **Yes** (Consented pilots only) |

Synthetic logs (marked with `synthetic: true`) are permanently tagged as non-commercial and never count toward pilot engagement metrics or traction volume.

---

## 4. Dual-Witness Canonical Verification

To prevent phantom receipts and single-node RPC spoofing, the verification port (`receipt-proof-generator`) requires two distinct, independent RPC providers (e.g., Arc Primary and QuickNode Secondary):
1. **Chain ID Verification**: Must equal Chain `5042002`.
2. **Consensus Agreement**: Both witnesses must return identical block hashes for the confirmed receipt block.
3. **Confirmations**: The transaction must achieve at least 2 confirmations relative to the lowest observed head block height.
4. **Log Inspection**: The ERC-20 `Transfer` topic must match the exact sender address, recipient address, and token amount in micro-units.

Receipts meeting all four criteria generate a canonical markdown summary linking to `https://testnet.arcscan.app/tx/{hash}`.

---

## 5. Running the Simulator via CLI

To execute a local shadow-mode simulation batch:

```bash
# Verify unit test invariants
cd backend && node ./node_modules/tsx/dist/cli.mjs --test test/shadow-mode.test.ts

# Generate traction metrics report from an evidence file
node scripts/traction-reporter.mjs --input backend/src/fixtures/sample-evidence.json
```

For operational questions or custom policy rulesets, reach out to `support@mercenta.xyz`.
