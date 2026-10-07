# Mercenta — System Architecture & Trust Boundaries

Mercenta is an institutional commerce and autonomous treasury operator built on the **Circle Agent Stack** and **Arc Network**. This document describes a design model, not proof of deployed end-to-end integration. The new dual-witness and shadow-mode modules are locally tested helpers. One Testnet RPC is configured; a second independent provider and consented pilot evidence are pending. Mainnet remains closed. See [integration review](../submission/INTEGRATION-REVIEW.md).

---

## 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client & Operator Interfaces"]
        UI["Web Interface (Next.js / App Router)"]
        Agent["Autonomous Agent (Operator Console)"]
    end

    subgraph PolicyLayer ["Policy & Validation Gateway"]
        Auth["Wallet Authentication (EIP-712 / Session)"]
        TaskScope["Task Boundary & Scope Validator"]
        PolicyEngine["Deterministic Policy Engine (P1-P11)"]
    end

    subgraph ExecutionLayer ["Core Ledger & Execution (Backend)"]
        Orders["Orders Service & Idempotency Store"]
        Ledger["Intent-Aware Ledger Gate (6-Error Protection)"]
        SQLite["SQLite WAL Store (Persistent State)"]
    end

    subgraph SettlementLayer ["Cryptographic Settlement"]
        Gateway["Circle Gateway x402 Micropayments"]
        ArcTestnet["Arc Network Testnet (Chain ID 5042002)"]
        DualWitness["Dual-Witness Receipt Verifier"]
    end

    UI --> Auth
    Agent --> Auth
    Auth --> TaskScope
    TaskScope --> PolicyEngine
    PolicyEngine --> Orders
    Orders --> Ledger
    Ledger --> SQLite
    Orders --> Gateway
    Gateway --> ArcTestnet
    ArcTestnet --> DualWitness
    DualWitness --> Ledger
```

---

## 2. Finite State Machine (FSM) Lifecycle

Orders and procurement actions transition through a deterministic finite state machine where ambiguous transport states are quarantined rather than retried or refunded prematurely.

```mermaid
stateDiagram-v2
    [*] --> AWAITING_PAYMENT : Order Created (Quote Verified)
    AWAITING_PAYMENT --> ESCALATED : Above Auto-Limit (>10 USDC)
    AWAITING_PAYMENT --> APPROVED : Auto-Approved (Payment Final >=2 confs)
    AWAITING_PAYMENT --> REFUND_REQUIRED : Policy Blocked / Expired

    ESCALATED --> APPROVED : Merchant Reviewer Approved
    ESCALATED --> REFUND_REQUIRED : Human Rejected / Policy Breach

    APPROVED --> PURCHASING : Claimed & Durable Reserve Locked
    PURCHASING --> FULFILLED : Supply Completed & Cost Paid
    PURCHASING --> SUPPLIER_UNKNOWN : Transport Timeout / Gateway 504

    SUPPLIER_UNKNOWN --> FULFILLED : Reconciliation Proven Executed
    SUPPLIER_UNKNOWN --> REFUND_REQUIRED : Reconciliation Proven Not Executed

    FULFILLED --> [*]
    REFUND_REQUIRED --> [*]
```

---

## 3. The 6-Error Intent-Aware Accounting Gate

Drawing from Canteen's *Agents and Ledgers* accounting integrity principles, The regression suite covers six classical accounting-error cases with complete intent witnesses. Optional intent checks do not cover every production posting. External omissions cannot be detected by an internal journal alone; independent reconciliation remains required:

| Error Type | Threat Vector | Mercenta Mitigation Gate |
| :--- | :--- | :--- |
| **Omission** | Transaction occurs but journal entry is omitted | Atomic SQLite transaction wraps order update and journal posting. |
| **Commission** | Transaction posted to the wrong entity or account | Intent validation confirms recipient matches quote specification. |
| **Principle** | Misclassified asset or balance sheet line | Strict account hierarchy (`customer:liability`, `arc:reserved`, `settlement:paid`). |
| **Original Entry / Replay** | Same transaction recorded twice | Durable idempotency keys (`externalEventId` / `order_requests`). |
| **Compensating Error** | Two erroneous entries coincidentally cancel out | Granular line-item amount and direction validation. |
| **Complete Reversal** | Accidental debit/credit inversion | Directional constraint checks fail closed on inverted lines. |

---

## 4. Circle Agent Stack & Dual-Witness Verification

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Autonomous Agent
    participant Hub as Mercenta Backend
    participant Circle as Circle Gateway (x402)
    participant Arc as Arc Testnet
    participant W1 as Primary Witness (Arc RPC)
    participant W2 as Secondary Witness (Independent Provider Required)

    Agent->>Hub: Submit Order Intent (Product, Qty)
    Hub->>Hub: Evaluate Policy (P1-P11) & Reserve Funds
    Hub->>Circle: Create EIP-712 Payment Authorization
    Circle->>Arc: Broadcast USDC Settlement
    Arc-->>Hub: Return Transaction Hash
    Hub->>W1: Query Receipt & Block Hash
    Hub->>W2: Query Receipt & Block Hash
    Note over Hub: Verify Block Hash Match & Confs >= 2
    Hub-->>Agent: Mint Canonical Evidence Receipt (ArcScan Link)
```

---

## 5. Hackathon Judging Matrix Alignment

*(Note: User-supplied rubric weights and potential prizes are marked as awaiting official sponsor verification.)*

| Hackathon Criterion | Weight* | Mercenta Architectural Implementation |
| :--- | :--- | :--- |
| **Traction & Usability** | 30%* | Shadow-mode helper and dual-witness verifier; real consented pilot volume is not yet attested. |
| **Agentic Sophistication** | 30%* | Deterministic FSM, hardware-like boundary invariants (order ceiling, per-run cap, reserve floor), 6-error ledger gate. |
| **Circle Agent Stack** | 20%* | Circle Gateway x402 integration, EIP-712 authorization, USYC quantitative treasury planning math. |
| **Innovation & Vision** | 20%* | Institutional commerce infrastructure enabling AI agents to purchase developer APIs, compute, and platform keys securely. |

*\*Rubric percentages provided by project owner; awaiting official event guidelines verification.*
