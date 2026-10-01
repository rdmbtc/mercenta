# Mercenta (MERC) — Master Implementation Plan, Architecture & Mainnet Roadmap

> **Mercenta** — Autonomous USDC-Native Commerce OS, Treasury & Digital Goods Clearinghouse on Arc.  
> **Tagline:** Sell. Settle. Fulfill. Earn.  
> **Token / Ticker Shorthand:** MERC  
> **Primary Domain:** `mercenta.xyz`  
> **Application Console:** `app.mercenta.xyz`  
> **Digital Goods Catalog:** `catalog.mercenta.xyz`  
> **Developer Documentation:** `docs.mercenta.xyz`  
> **System Telemetry:** `status.mercenta.xyz`  
> **Environments:** `testnet.mercenta.xyz` (Arc Testnet `5042002`) → `mainnet.mercenta.xyz` (Arc Mainnet)

```text
       ┌────────────────────────────────────────────────────────┐
       │             Mercenta Commerce & Treasury OS            │
       └────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[Storefront & Catalog]     [Autonomous Agent]             [Circle Arc App Kits]
• 5 Institutional Rails    • Advisory & Procurement       • Earn (USDC Vaults)
• Instant Search / Batch   • Powered by LLM Model Provider AI         • Borrow (cirBTC Collateral)
• Dual Checkout (Web3/Fiat)• 10 Free → Paid Nanopayments  • Onramp (Fiat Card/Apple Pay)
    │                               │                               │
    └───────────────────────┬───────┴───────────────────────────────┘
                            ▼
               [Order State Machine & FSM]
                            │
                            ▼
          [Deterministic Policy Engine (deterministic architecture)]
          • Margin Floor (bps)    • Liquidity Floor
          • Auto-Purchase Limits  • Circuit Breakers
               ┌────────────┴────────────┐
               ▼                         ▼
      [Auto-Approved]           [Escalated / Blocked]
               │                         │
               ▼                         ▼
   [Upstream Supply Node]       [Seller Approval Queue]
   • Idempotent Purchase Ref
   • Encrypted Digital Delivery
               │
               ▼
   [Immutable Double-Entry Ledger]
   • arc:usdc:available  • revenue:usdc
   • arc:usdc:reserved   • cogs:usd
   • fees:usdc           • profit:usdc
```

---

## 1. Executive Summary & Hackathon Positioning

Mercenta is built specifically for the **Tameion Agents Hackathon** hosted by **Canteen** in partnership with **Circle** & **Arc**. It answers the fundamental challenge of autonomous commerce: **giving an AI agent spending authority without giving it a blank check**.

In traditional commerce, software cannot hold, verify, or move money. In naive crypto AI agents, models hallucinate transactions, exceed budgets, and retry failed API calls until bankrupted.

Mercenta solves this through the **deterministic architecture Architectural Standard**:
1. **Zero LLM Authority Over Financial Mutation:** AI models propose intents, advise users, and discover products, but the execution path is strictly gated by a deterministic TypeScript/Rust policy engine.
2. **Circle Arc Native Settlement:** Settles on Arc with sub-second deterministic finality, paying gas in native USDC (~$0.01 per tx) with 6-decimal integer precision.
3. **DeFi Liquidity Management via Circle App Kits:** Idle treasury is not left barren; it is allocated to **Earn vaults** on Arc. Temporary working capital is originated through **cirBTC collateralized Borrowing**. Non-crypto buyers fund orders seamlessly via embedded **Fiat Onramp**.
4. **Interactive AI Advisory & Procurement:** Users and software agents consult with specialized on-site AI agents powered by the **`LLM Model Provider` AI model pipeline** (`LLM Model Provider/gpt-6-astra`, `LLM Model Provider/glm-5.3`, `LLM Model Provider/free-gemini-3.8-flash`) with **10 free consultation requests**, transitioning into pay-per-request Arc USDC nanopayments upon Mainnet launch.
5. **Strict Supplier Confidentiality:** All digital assets are abstracted under 5 institutional categories without exposing upstream wholesale infrastructure.

### Alignment with Tameion Requests for Builders (RFBs)

| RFB | Title | Mercenta Implementation |
|---|---|---|
| **RFB 01** | **Intelligent Business Treasury** | Dynamic treasury monitoring, cash-flow runway forecasting, and automatic routing of idle USDC into **Arc Earn vaults**; rapid redemption when inventory payments are due. |
| **RFB 02** | **AP/AR Automation Agent** | Automated ingestion of digital goods orders, on-chain USDC payment verification, duplicate transaction prevention (`UNIQUE(tx_hash)`), and deterministic margin validation. |
| **RFB 03** | **Contractor & Vendor Network** | Upstream supplier health tracking, circuit breakers on supplier timeouts, and strict `SUPPLIER_UNKNOWN` reconciliation without blind retries. |
| **RFB 04** | **Autonomous Business Operator** | End-to-end autonomous retail loop: customer pays USDC → verified on-chain → policy engine confirms margin & reserve → upstream purchase clears → encrypted key delivered → revenue, COGS, and profit booked to immutable ledger. High-value orders escalate to human approval. |
| **RFB 05** | **Compliance Intelligence Agent** | Address verification, risk-tiered spending caps, and tamper-proof decision logs recording inputs, rule versions, and cryptographic reason hashes. |

---

## 2. Institutional Product Nomenclature & Privacy Guardrails

Per **Rule 5 (Supplier Confidentiality)**, the name of the upstream wholesale provider ([REDACTED_PROVIDER]) **MUST NEVER APPEAR** in public code, user interfaces, landing copy, API routes, documentation, or commits.

All inventory is organized strictly into **Mercenta's 5 Institutional Rails**:

1. **Gaming Keys & Platform Vouchers (`gaming`)**
   - Activation keys and stored-value digital cards for gaming ecosystems (Steam, PlayStation, Xbox, Epic Games, Riot, Blizzard, Nintendo).
2. **Streaming & Media Subscriptions (`streaming`)**
   - Prepaid access codes and vouchers for global on-demand video and audio networks (Netflix, Spotify, YouTube Premium, Apple Music, Disney+, Crunchyroll).
3. **Creator & Game Micro-Donations (`creator`)**
   - Agent micro-payment packs, live stream tipping tokens, and creator subscription bundles (Twitch Bits, Kick, Patreon, Discord Nitro).
4. **Developer API & Token Bundles (`developer`)**
   - Wholesale prepaid credit pools for AI models, developer cloud toolkits, and software licenses (OpenAI API credits, Anthropic token pools, IDE subscriptions, VPNs).
5. **Cloud Compute & GPU Vouchers (`cloud`)**
   - Dedicated high-performance cluster leases, elastic inference pods, and server allocations (NVIDIA H100 SXM5 clusters, A100 80GB pods, GH200 Grace Hopper nodes, vLLM endpoints).

---

## 3. Technology Stack & Multi-Chain Primitives

### 3.1 Network & Settlement Architecture

| Layer | Environment | Parameters |
|---|---|---|
| **Phase 1: Testnet Sandbox** | Arc Testnet | Chain ID: `5042002` (`0x4CEF52`)<br>Canonical USDC: `0x3600000000000000000000000000000000000000`<br>RPC: `https://testnet.arc.network`<br>Fallback RPC: `https://arc-node.thecanteenapp.com`<br>Explorer: `https://testnet.explorer.arc.network` |
| **Phase 2: Production Mainnet** | Arc Mainnet + Base / Solana | High-throughput sub-second deterministic finality, native USDC gas, real merchant liquidity settlement. |

### 3.2 App Kits Suite (`@circle-fin/app-kit`)

We leverage Circle's unified App Kit SDK with the Viem adapter (`@circle-fin/adapter-viem-v2`):

```bash
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem
```

1. **Earn Kit (`kit.earn`)**:
   - **Vault Exploration**: Queries lending protocols on Arc for current APY and TVL (`kit.earn.exploreVaults`).
   - **Treasury Staking**: Deposits excess idle USDC from `arc:usdc:available` into yield-bearing vaults.
   - **Instant Redemption**: Withdraws principal plus accrued yield when large wholesale purchases are scheduled.
2. **Borrow Kit (`kit.borrow`)**:
   - **Collateralized Loans**: Borrows USDC on Arc against `cirBTC` (Circle-wrapped Bitcoin) collateral (`kit.borrow.borrow`).
   - **Liquidity Buffer**: Supplies immediate working capital for inventory purchase spikes without liquidating long-term crypto treasury reserves.
   - **Health Factor Monitoring**: Subscribes to loan health webhooks to prevent liquidation.
3. **Onramp Kit (`kit.onramp`)**:
   - **Embedded Checkout Widget**: Non-crypto buyers purchase digital goods using Debit Card, Apple Pay, or Google Pay (`kit.onramp.mountIframe`).
   - **Direct Arc Delivery**: Fiat is converted to USDC and delivered directly to the buyer's Arc wallet or session checkout address.
4. **Swap & Bridge Kits (`kit.swap`, `kit.bridge`, `kit.unifiedBalance`)**:
   - **Stable FX**: Instant swapping between USDC and EURC on Arc (`kit.swap`).
   - **Unified Balance**: Aggregates USDC from Ethereum, Base, and Arbitrum into a single spendable pool on Arc (`kit.unifiedBalance.deposit`, `kit.unifiedBalance.spend`).

### 3.3 AI Model Engine (`LLM Model Provider` Infrastructure)

The platform integrates the **`LLM Model Provider` AI model suite** with tiered execution:
- **Lead Orchestrator / Architect**: `LLM Model Provider/gpt-6-astra`, `LLM Model Provider/gpt-6-sol`
- **Heavy Reasoning Workers**: `LLM Model Provider/glm-5.3`, `LLM Model Provider/qwen3.8-max`
- **Fast / Realtime Interactive Agents**: `LLM Model Provider/free-gemini-3.8-flash`, `LLM Model Provider/free-deepseek-v4.1-flash`, `LLM Model Provider/glm-5.3-flash`

#### Usage & Metering Architecture
- **Initial Free Tier**: Every connected wallet / guest session receives **10 free consultation requests**.
- **On-Screen Quota Widget**: Real-time counter showing remaining free requests (e.g. `10/10 Free Advisory Requests`).
- **Phase 2 Paid Tier (Mainnet Transition)**:
  - Once the 10 free requests are consumed, subsequent requests require micro-settlement in USDC.
  - Price per request calibrated to model tier (e.g. $0.005 for Flash, $0.02 for Heavy/Astra).
  - Settled seamlessly via Arc USDC nanopayments / x402 payment headers.

---

## 4. Multi-Agent Ecosystem on the Website

Mercenta deploys two specialized client-facing agent roles directly into the web application:

### Agent Role A: Mercenta Advisory & Procurement Agent (`catalog.mercenta.xyz`)
- **Location**: Embedded interactive assistant in `/catalog`.
- **Capabilities**:
  - Semantic product discovery: Translates user natural language needs (e.g., *"I need an inference cluster for a 70B parameter model for 7 days"*) into exact catalog SKUs (e.g., `Dedicated 8x H100 SXM5 GPU Cluster - 7d lease`).
  - Cross-product bundling: Generates structured multi-item manifests (JSON batch) combining compute vouchers, API tokens, and subscription codes.
  - Regional SKU guidance: Verifies country code compatibility (GLOB, US, EU, AE, CIS) before purchase.
  - Quota-metered responses via `LLM Model Provider` models.

### Agent Role B: Autonomous Treasury & Liquidity Co-Pilot (`app.mercenta.xyz`)
- **Location**: Control plane in `/app` (Treasury, Earn & Borrow Cockpit).
- **Capabilities**:
  - Treasury health checks: Analyzes available vs. reserved USDC balances.
  - Yield optimization: Recommends moving idle operating cash into Arc Earn vaults based on historical purchase velocity.
  - Borrowing advisory: Calculates required cirBTC collateral, borrowing capacity, and liquidation safety margins for large wholesale restocking.
  - Policy simulation: Explains why simulated or live orders passed, escalated, or were blocked by policy guardrails.

---

## 5. Domain Ecosystem & Navigation Architecture

```text
┌─────────────────────────┬───────────────────────────────────────────────┐
│ Subdomain / Route       │ Primary Purpose & Target Audience             │
├─────────────────────────┼───────────────────────────────────────────────┤
│ mercenta.xyz (/)        │ Flagship cinematic landing page:             │
│                         │ • Story hero with video scrubbing             │
│                         │ • Interactive Policy Terminal sandbox         │
│                         │ • Institutional rails showcase                │
│                         │ • Ecosystem architecture diagram              │
├─────────────────────────┼───────────────────────────────────────────────┤
│ app.mercenta.xyz (/app) │ Central Operator Hub & Seller Console:        │
│                         │ • Real-time order queue & state machine       │
│                         │ • Treasury overview (Available vs. Reserved)  │
│                         │ • DeFi Cockpit: Earn vaults & cirBTC Borrow   │
│                         │ • Policy envelope editor & guardrail metrics  │
│                         │ • Human approval queue for high-value orders  │
│                         │ • Decision replay trail with reason hashes    │
├─────────────────────────┼───────────────────────────────────────────────┤
│ catalog.mercenta.xyz    │ Digital Goods Showcase & Shopping Portal:     │
│ (/catalog)              │ • Live inventory across all 5 categories      │
│                         │ • Instant search (⌘K) & multi-attribute filter│
│                         │ • Interactive AI Shopping Assistant (LLM Model Provider)  │
│                         │ • Batch manifest builder & JSON export        │
│                         │ • Direct checkout with Arc USDC & Onramp      │
├─────────────────────────┼───────────────────────────────────────────────┤
│ testnet.mercenta.xyz    │ Sandbox environment running on Arc Testnet    │
│                         │ (Chain ID 5042002) with testnet USDC.         │
├─────────────────────────┼───────────────────────────────────────────────┤
│ mainnet.mercenta.xyz    │ Production environment with real onchain      │
│                         │ USDC clearing, Earn/Borrow, and live delivery.│
├─────────────────────────┼───────────────────────────────────────────────┤
│ docs.mercenta.xyz       │ Developer API docs, Agent SDK specifications, │
│                         │ webhook signatures, and architecture guides.  │
├─────────────────────────┼───────────────────────────────────────────────┤
│ status.mercenta.xyz     │ Real-time gateway SLA, transaction latencies, │
│ (/status)               │ and upstream provider health indicators.      │
└─────────────────────────┴───────────────────────────────────────────────┘
```

---

## 6. Complete Order State Machine & Policy Gates

### 6.1 Strict State Machine Transitions

```text
CREATED
   │
   ▼
AWAITING_PAYMENT ───(Timeout / TTL)───► EXPIRED
   │
   ▼
PAYMENT_DETECTED
   │
   ├─► UNDERPAID (Partial amount rejected, refund queued)
   ├─► DUPLICATE (Replayed tx_hash rejected)
   ▼
PAYMENT_CONFIRMED (1+ Confirmations on Arc)
   │
   ▼
POLICY_CHECK (Evaluated by Deterministic Policy Engine)
   │
   ├─► BLOCKED (Negative margin, margin < floor, daily limit breach)
   ├─► ESCALATED (Order > auto limit, reserve floor breach → Seller Review)
   │         │
   │         ├─► APPROVED (Human signs)
   │         └─► REJECTED (Human declines → REFUND_PENDING)
   ▼
APPROVED
   │
   ▼
PURCHASING (Idempotent call to Upstream Supply Node with HMAC ref)
   │
   ├─► FULFILLED (Encrypted delivery payload decrypted & stored)
   └─► SUPPLIER_UNKNOWN (5xx / Timeout)
             │
             ▼
       [Background Reconciler]
             ├─► FULFILLED (Supplier completed order)
             └─► FAILED / REFUND_PENDING (Supplier did not execute)
```

### 6.2 Deterministic Policy Rules Matrix (P1–P11)

| Gate | Check Description | Threshold / Condition | Action on Failure |
|---|---|---|---|
| **P1** | Payment Finality | Arc block confirmations >= 2 | Wait / Reject |
| **P2** | Exact Amount | `paid_units >= order.sale_amount_usdc_units` | Mark `UNDERPAID` |
| **P3** | Replay Protection | `tx_hash` not in `orders.payment_tx_hash` | Mark `DUPLICATE` / `BLOCKED` |
| **P4** | SKU Active | Product status is active | Mark `BLOCKED` (`SKU_DISABLED`) |
| **P5** | Supplier Online | Provider circuit breaker is closed | Mark `BLOCKED` (`SUPPLIER_OFFLINE`) |
| **P6** | Margin Positive | `sale_amount_units > quoted_cost_units` | Mark `BLOCKED` (`NEGATIVE_MARGIN`) |
| **P7** | Margin Floor | `margin_bps >= 1500` (15.0% floor) | Mark `BLOCKED` (`MARGIN_BELOW_FLOOR`) |
| **P8** | Auto-Purchase Cap | `sale_amount_units <= 10_000_000n` (10 USDC) | Mark `ESCALATED` (`ABOVE_AUTO_LIMIT`) |
| **P9** | Daily Spend Cap | `daily_spent + cost <= 2_500_000_000n` | Mark `BLOCKED` (`DAILY_LIMIT_EXCEEDED`)|
| **P10**| Reserve Floor | `reserve_after_purchase >= 10_000_000_000n` | Mark `ESCALATED` (`RESERVE_BREACHED`) |
| **P11**| Quote Staleness | `quote_age <= 300` seconds | Mark `BLOCKED` (`STALE_QUOTE`) |

---

## 7. Dual-Checkout Architecture: Web3 & Fiat Onramp

Every product purchase supports two checkout paths:

```text
                       [Customer Checkout]
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
[Path A: Direct Arc USDC]                    [Path B: Fiat-to-USDC Onramp]
• Connect Web3 Wallet                       • Click "Pay with Card / Apple Pay"
  (MetaMask, Rabby, Circle DCW)             • Arc App Kit Onramp iframe loads
• Instant 1-click USDC transfer             • Buyer enters card / fiat payment
• Sent directly to Merchant Treasury        • Onramp settles USDC directly to Arc
• Observed by Arc Verifier                  • onDepositSettled webhook triggers
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
                   [Payment Verifier Confirms]
                                ▼
                     [Policy Engine Evaluates]
                                ▼
                 [Fulfillment & Code Reveal]
```

### Onramp SDK Integration Details (`@circle-fin/app-kit`)

```typescript
// Client-side widget mount in checkout modal
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapter } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit({
  apiKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY,
});

export async function openFiatCheckout(orderId: string, recipientWallet: string) {
  // 1. Fetch authenticated session from server
  const session = await kit.onramp.fetchSession({
    url: `/api/orders/${orderId}/onramp-session`,
    body: {
      appUserId: `guest-${orderId}`,
      destinationAddress: recipientWallet,
    },
  });

  // 2. Mount iframe
  const widget = kit.onramp.mountIframe({
    session,
    container: document.getElementById("onramp-container")!,
    onDepositSettled: async ({ payload }) => {
      // 3. Inform backend verifier of settled onramp transfer
      await fetch(`/api/orders/${orderId}/verify-onramp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: payload.txHash }),
      });
    },
  });
}
```

---

## 8. DeFi Treasury & Liquidity Architecture (Earn & Borrow)

To maximize working capital efficiency for digital goods procurement, Mercenta's Treasury Engine integrates Arc Earn and Borrow directly into `/app`.

### 8.1 Arc Earn Protocol Integration

```typescript
// Server-side / Agent Treasury Executor
import { AppKit } from "@circle-fin/app-kit";

// Explore available yield vaults on Arc
export async function getEarnVaults() {
  const { vaults } = await kit.earn.exploreVaults({
    chain: "Arc_Testnet", // Phase 1, Arc_Mainnet in Phase 2
    sortBy: "apy",
  });
  return vaults;
}

// Autonomous Agent moves idle USDC to vault
export async function depositIdleTreasury(vaultAddress: string, amountUsdc: string) {
  return await kit.earn.deposit({
    from: { adapter: viemAdapter, chain: "Arc_Testnet" },
    vaultAddress,
    amount: amountUsdc, // e.g. "5000.00"
  });
}

// Redeem when inventory orders deplete available operating cash
export async function redeemTreasuryLiquidity(vaultAddress: string, sharesToRedeem: string) {
  return await kit.earn.withdraw({
    from: { adapter: viemAdapter, chain: "Arc_Testnet" },
    vaultAddress,
    shares: sharesToRedeem,
  });
}
```

### 8.2 Arc Borrow Protocol Integration (cirBTC Collateral)

```typescript
// Originate emergency liquidity loan to prevent inventory stockout
export async function borrowOperatingCash(marketId: string, borrowAmountUsdc: string) {
  // Borrow USDC against posted cirBTC collateral in an atomic Arc transaction
  return await kit.borrow.borrow({
    from: { adapter: viemAdapter, chain: "Arc_Testnet" },
    marketId,
    borrowAmount: borrowAmountUsdc, // e.g. "1000.00"
  });
}
```

---

## 9. AI Consultation & Metering Pipeline (`LLM Model Provider`)

```text
[User / Buyer in Browser]
       │
       ▼ (Sends query: "Recommend best GPU cluster for fine-tuning")
[POST /api/agent/chat]
       │
       ▼
[Quota Verifier (SQLite / Session)]
       │
       ├─► Request Count <= 10: CLEARED (Free Tier)
       │         │
       │         ▼
       │   [Proxy to LLM Model Provider AI Models API]
       │   • Streaming Response via SSE
       │   • Context injected with live Mercenta catalog snapshot
       │   • Formats product links & JSON batch actions
       │
       └─► Request Count > 10:
                 │
                 ▼
           [Phase 1: Testnet Preview Alert]
           "10 Free Requests Used. In Mainnet, requests cost $0.01 USDC."
                 │
                 ▼
           [Phase 2: Mainnet Micropayment Gate]
           "Sign $0.01 USDC Arc Transfer Authorization (x402)"
```

### API Implementation Schema (`/api/agent/chat`)

```typescript
export interface AgentChatPayload {
  sessionId: string;
  walletAddress?: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  contextScope: "catalog" | "treasury" | "general";
}

export interface AgentChatResponse {
  message: string;
  recommendedSkus?: string[];
  suggestedAction?: {
    type: "ADD_TO_BATCH" | "NAVIGATE_EARN" | "PREVIEW_BORROW";
    payload: Record<string, unknown>;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
    isPaid: boolean;
  };
}
```

---

## 10. Database Schema (SQLite + Immutable Triggers)

The schema stores products, orders, decisions, approvals, immutable ledger lines, and AI agent quota records:

```sql
-- 1. Products (Sanitized institutional catalog)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  supplier_sku_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('gaming','streaming','creator','developer','cloud')),
  product_type TEXT NOT NULL CHECK(product_type IN ('voucher','direct_topup','esim')),
  country_code TEXT DEFAULT 'GLOB',
  price_usdc_units INTEGER NOT NULL, -- 6 decimals
  cost_usd_cents INTEGER NOT NULL,
  margin_floor_bps INTEGER NOT NULL DEFAULT 1500, -- 15%
  max_auto_purchase_usdc_units INTEGER NOT NULL DEFAULT 10000000, -- 10 USDC
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 2. Orders (State machine lifecycle)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  denomination_id TEXT,
  customer_wallet TEXT NOT NULL,
  sale_amount_usdc_units INTEGER NOT NULL,
  status TEXT NOT NULL, -- CREATED, AWAITING_PAYMENT, PAYMENT_CONFIRMED, APPROVED, FULFILLED, etc.
  payment_tx_hash TEXT UNIQUE,
  payment_method TEXT NOT NULL DEFAULT 'DIRECT_CRYPTO', -- 'DIRECT_CRYPTO' | 'FIAT_ONRAMP'
  supplier_reference TEXT UNIQUE,
  delivery_status TEXT NOT NULL DEFAULT 'NONE',
  encrypted_delivery_payload TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 3. Decisions (Audit trail with reason hash)
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  decision TEXT NOT NULL, -- 'AUTO_APPROVED' | 'BLOCKED' | 'ESCALATED'
  reason_codes TEXT NOT NULL, -- JSON array
  reason_hash TEXT NOT NULL, -- SHA-256 canonical hash
  policy_version TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  agent_summary TEXT,
  created_at INTEGER NOT NULL
);

-- 4. Approvals Queue (Human-in-the-loop)
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  required_limit_units INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
  approved_by TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);

-- 5. Immutable Ledger Entries (Double-Entry)
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  account TEXT NOT NULL, -- 'arc:usdc:available', 'revenue:usdc', 'cogs:usd', etc.
  amount_units INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK(currency IN ('USDC','USD')),
  direction TEXT NOT NULL CHECK(direction IN ('DEBIT','CREDIT')),
  tx_hash TEXT,
  policy_version TEXT NOT NULL,
  decision_id TEXT REFERENCES decisions(id),
  created_at INTEGER NOT NULL
);

-- Triggers enforcing append-only immutability on ledger
CREATE TRIGGER forbid_ledger_update BEFORE UPDATE ON ledger_entries
BEGIN
  SELECT RAISE(FAIL, 'deterministic architecture Violation: ledger_entries is immutable');
END;

CREATE TRIGGER forbid_ledger_delete BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(FAIL, 'deterministic architecture Violation: ledger_entries records cannot be deleted');
END;

-- 6. AI Agent Quotas & Conversations (LLM Model Provider)
CREATE TABLE ai_quotas (
  identifier TEXT PRIMARY KEY, -- wallet address or session UUID
  free_requests_used INTEGER NOT NULL DEFAULT 0,
  paid_requests_count INTEGER NOT NULL DEFAULT 0,
  last_request_at INTEGER NOT NULL
);

CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL REFERENCES ai_quotas(identifier),
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

---

## 11. Phased Execution Roadmap

### Phase 1: Arc Testnet Flagship & Hackathon Delivery (Current Sprint)
- [x] **Storefront & Catalog Experience**: 1,291 live digital SKUs categorized into 5 institutional rails with instant search, brand logo resolvers, and manifest builder.
- [x] **Arc Testnet Viem Adapter**: Direct connection to Arc Testnet (`5042002`) with USDC 6-decimal verification and double-spend rejection.
- [x] **Order FSM & State Guards**: Transition guards preventing illegal jumps, expired order rejections, and underpaid flags.
- [x] **Deterministic Policy Matrix**: 11 automated checkpoints (margin floor, auto-limits, daily spend, reserve floor).
- [x] **Immutable Ledger**: Append-only SQLite ledger with trigger-enforced protection.
- [x] **Comprehensive Test Suite**: 119 unit and integration tests passing cleanly in Vitest.
- [ ] **Interactive AI Agent Chat**: Embed AI procurement advisor in `/catalog` and treasury co-pilot in `/app` powered by `LLM Model Provider` models with 10 free requests quota.
- [ ] **DeFi Liquidity Cockpit (App Kit)**:
  - Add **Earn** module: Explore testnet vaults, deposit simulated/testnet USDC, preview yield.
  - Add **Borrow** module: Loan calculator, cirBTC collateral ratio preview, borrow USDC simulation.
  - Add **Onramp** testbed widget: Integrated card funding modal in `/app` and `/catalog`.
- [ ] **Demo Video & Documentation**: Record crisp 3-minute walkthrough demonstrating customer order → on-chain settlement → policy check → supplier code delivery + AI agent advisory + Earn/Borrow liquidity management.

### Phase 2: Mainnet Launch & Commercial Scaling (Post-Hackathon)
- [ ] **Mainnet Settlement**: Transition contracts and verifiers from Arc Testnet to Arc Mainnet with real USDC gas and sub-second finality.
- [ ] **Live Wholesale Invoicing**: Connect live API clearing with encrypted key delivery for high-volume orders.
- [ ] **Production Arc Earn & Borrow**: Deploy production treasury funds into active Arc Earn lending vaults; connect real cirBTC collateral pools.
- [ ] **Production Fiat Onramp**: Finalize KYB verification in Circle Console to accept global Debit Cards, Apple Pay, and Google Pay on `mercenta.xyz`.
- [ ] **Paid AI Agent Tier**: Implement Arc USDC nanopayments ($0.005–$0.02) after the 10 free requests quota is consumed.
- [ ] **Mintlify Developer Portal**: Deploy comprehensive documentation at `docs.mercenta.xyz`.

---

## 12. Rigorous Test Plan & Quality Gates

### Gate G0: Preflight & Connectivity
- [ ] Upstream API returns HTTP 200 with valid items when called with authentic headers.
- [ ] Arc Testnet RPC responds with `eth_blockNumber` and `eth_chainId == 0x4CEF52`.
- [ ] Viem client reads canonical Arc USDC (`0x3600...0000`) 6-decimal balance.

### Gate G1: Money & FSM Safety
- [ ] 100% of money calculations use `BigInt` (no `Number` floating-point math).
- [ ] All USDC representations use integer micro-units (`1.00 USDC = 1_000_000n`).
- [ ] State machine enforces that `CREATED` cannot transition directly to `FULFILLED`.

### Gate G2: Policy Engine Determinism
- [ ] Profit < 15% floor → `BLOCK` with `MARGIN_BELOW_FLOOR`.
- [ ] Cost > Sale price → `BLOCK` with `NEGATIVE_MARGIN`.
- [ ] Order > 10 USDC → `ESCALATE` with `ABOVE_AUTO_LIMIT` (enters human approval queue).
- [ ] Replayed `tx_hash` → `BLOCK` with `PAYMENT_ALREADY_USED`.

### Gate G3: Circle Arc App Kits
- [ ] `kit.earn.exploreVaults` returns available yield vaults on Arc Testnet.
- [ ] `kit.borrow.borrow` calculates collateral health factor correctly before transaction signing.
- [ ] `kit.onramp.fetchSession` successfully mints an authenticated session iframe.

### Gate G4: AI Agent & Quota Integrity
- [ ] User receives instant answers from `LLM Model Provider` AI model.
- [ ] Quota counter correctly decrements from 10 to 0.
- [ ] Request 11 prompts for Mainnet micropayment upgrade without throwing 500 error.

### Gate G5: Ledger Immutability
- [ ] Direct `UPDATE` query on `ledger_entries` raises SQLite FAIL.
- [ ] Direct `DELETE` query on `ledger_entries` raises SQLite FAIL.
- [ ] Sum of Credits equals sum of Debits for every cleared order.

### Gate G6: Confidentiality Audit (Rule 5)
- [ ] Zero occurrences of upstream provider identity in client bundles, public HTML, logs, or documentation.
- [ ] All products mapped to 1 of the 5 Mercenta institutional categories.

---

## 13. Definition of Done (DoD)

The project is fully complete and ready for final submission when:
1. An external user can open `mercenta.xyz` or `app.mercenta.xyz`, connect their wallet, and pay testnet USDC on Arc.
2. The user can consult with the on-site **AI Procurement Agent** (up to 10 free requests) to find and bundle products.
3. The merchant console allows testing and previewing **Earn USDC** and **Borrow against cirBTC** via Circle Arc App Kits.
4. Orders are strictly verified on-chain via Viem before any fulfillment logic triggers.
5. The deterministic policy engine autonomously resolves `AUTO_APPROVED`, `BLOCKED`, or `ESCALATED`.
6. An intentional price shock immediately blocks an unprofitable order without moving funds.
7. High-value orders halt in the approval queue until manually signed in the console.
8. Double-entry ledger records all movements with immutable SQLite triggers.
9. All 119+ unit and integration tests pass cleanly (`npm test`).
10. Submission includes clean public GitHub repository, working live deployment link, and a 3-minute video walkthrough.
