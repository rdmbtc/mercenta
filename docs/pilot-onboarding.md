# Mercenta Pilot Partner Onboarding Handbook

Welcome to the **Mercenta Autonomous Commerce Pilot Program**. This handbook provides design partners, digital agencies, and independent development studios with clear operational procedures for evaluating Mercenta's deterministic agent commerce infrastructure.

---

## 1. Program Scope & Separation of Environments

Mercenta coordinates autonomous digital procurement under strict cryptographic and ledger policies. During the pilot program:

- **Production Banking Stays Isolated**: Your primary business fiat bank accounts, existing invoicing systems, and production payment gateways remain completely independent. Mercenta does not connect to or alter your primary banking rails.
- **Shadow Mode & Testnet Only**: All pilot evaluations run either as **read-only operational replay** (Shadow Mode) or across the **Arc Network Testnet (Chain ID 5042002)** using simulated USDC.
- **Testnet Tokens Are Not Real Money**: Digital codes and vouchers provisioned on the Arc Testnet are synthetic sandbox assets and carry zero commercial redemption value.
- **Mainnet Status**: Mainnet settlement remains disabled pending comprehensive formal audit and network mainnet release authorization.

---

## 2. Participant Consent & Data Minimization Checklist

Before participating in the pilot, partners must complete the following onboarding checklist:

1. **Explicit Data Consent**: Confirm that operational data ingested into the shadow simulator contains no unconsented third-party personal data, customer passwords, or private financial credentials.
2. **Data Minimization**: Pass operational events with anonymized pilot identifiers (e.g., `pilot-partner-[id]`), SHA-256 source digests, ISO-8601 timestamps, standard institutional categories, and micro-USDC quantities.
3. **Approval Ceilings**:
   - Single-Order Ceiling: Default limit is **50 USDC** per autonomous order.
   - Per-Run Accumulation Cap: Default limit is **100 USDC** per continuous execution batch.
   - Reserve Floor: The operator vault enforces a minimum **10 USDC** liquidity floor.
4. **Revocation Route**: Pilots may revoke consent or pause agent execution at any time by sending an immediate revocation notice to `support@mercenta.xyz` or by calling the emergency stop in the Operator Console.

---

## 3. Step-by-Step Operator Guide

### Step 1: Accessing the Operator Hub
Navigate to the web console at `http://localhost:3011` (or your assigned staging host). Select the **Arc Testnet** environment badge in the navigation header.

### Step 2: Configuring Agent Tool Leases
In the **Agent Operator** panel:
- Review the deterministic policy parameters (daily spend cap, reserve floor, and human escalation threshold).
- Confirm that tool leases are enabled for the five permitted institutional categories:
  1. *Gaming Keys & Platform Vouchers*
  2. *Streaming & Media Subscriptions*
  3. *Creator & Game Micro-Donations*
  4. *Developer API & Token Bundles*
  5. *Cloud Compute & GPU Vouchers*

### Step 3: Running Shadow Evaluation
Enable **Dry-Run Mode** (enabled by default) to simulate autonomous quoting, policy evaluation, and ledger reservation without broadcasting any network transactions. Review the simulated execution audit logs in real time.

### Step 4: Optional Testnet Mirror Run
If authorized for testnet validation, toggle the **Testnet Mirror** mode. The agent operator will execute testnet transactions with Arc Testnet USDC. Each transaction generates a cryptographic transaction receipt and dual-witness canonical consensus proof.

---

## 4. Understanding Evidence & Receipts

When reviewing operator telemetry and receipt proofs:

- **SIMULATED**: Local dry-run policy evaluation. Zero network transactions were generated. Useful for verifying budget rules and policy logic without latency.
- **TESTNET_MIRROR**: A transaction broadcast to Arc Testnet whose status is currently awaiting confirmations or dual-witness consensus.
- **VERIFIED**: Canonical settlement confirmed by two independent RPC witnesses with matching block hashes, minimum 2 confirmations, and verified ERC-20 transfer logs. Explorer links resolve to `https://testnet.arcscan.app/tx/{hash}`.

---

## 5. Support & Incident Response

- **Technical Support**: For configuration questions or assistance with replay datasets, contact `support@mercenta.xyz`.
- **Incident Escalation**: If an anomalous transaction or unexpected policy escalation occurs, contact `support@mercenta.xyz` with your pilot identifier and audit digest. The engineering team responds to pilot incidents within 1 hour during active evaluation windows.
