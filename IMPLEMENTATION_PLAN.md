# Mercenta (MERC) — Implementation Plan, Roadmap & Test Gates

> **Mercenta** — autonomous USDC-native digital-goods store on Arc.  
> **Tagline:** Sell. Settle. Fulfill.  
> **Token / Ticker Shorthand:** MERC  
> **Domain:** mercenta.xyz  
> **Official X:** @mercentaxyz  

```text
Customer pays USDC
→ payment verified on-chain
→ agent checks policy, margin, liquidity
→ AppRoute fulfils order
→ product delivered
→ revenue, cost, profit, decision recorded
```

Resale permission confirmed. Product catalogue broad. MVP starts with 1–3 reliable SKUs; catalogue scales after the first workflow is stable.

---

## 1. Scope Lock

### P0 — Must Ship
- Storefront with full product catalogue (games, vouchers, gift cards, subscriptions via AppRoute SDK).
- USDC checkout on Arc (Testnet `5042002`).
- **Fiat-to-USDC Onramp (Circle/Arc App Kit Onramp Widget):** встроенный виджет прямо в чекауте, чтобы любой пользователь мог купить цифровой товар с обычной банковской карты, моментально получив USDC на Arc без ухода с сайта.
- Server-side payment verification (viem, RPC event check).
- One complete AppRoute purchase flow.
- Digital delivery (encrypted storage, one-time reveal).
- Order state machine with strict transitions.
- Deterministic margin/liquidity policy engine.
- Autonomous fulfilment within policy limits.
- Blocked unprofitable order (margin protection).
- Human approval for high-value / low-margin actions.
- Immutable decision and append-only audit record.
- Seller dashboard with real metrics.
- Arc transaction explorer links.
- Duplicate payment and replay protection (`UNIQUE(tx_hash)`).
- AppRoute timeout reconciliation (no blind retry).

### P1 — Only After P0 Works
- More SKUs and product categories.
- AI pricing suggestions based on supplier cost trends.
- AI customer support grounded in actual order data.
- Supplier balance forecast and liquidity alerts.
- Automatic SKU pause/re-enable on supplier price shocks.
- Refund workflow.
- Multiple supplier fallback.

### Cut (Out of Scope for Hackathon)
- Multi-chain support (Arc USDC only).
- Generic multi-vendor marketplace.
- x402 router marketplace.
- Multi-tenant SaaS platform.
- Full accounting/ERP system.
- Native mobile app.
- AI copywriter / generic marketing chatbot.
- Custom banking gateways (we use official Arc App Kit Onramp for fiat-in).
- Custom smart contracts unless payment references strictly require one.

---

## 2. Branding & Identity

- **Name:** Mercenta
- **Shorthand / Ticker:** MERC
- **Domain:** mercenta.xyz
- **Tagline:** Sell. Settle. Fulfill.
- **Sub-tagline:** A digital store that protects your margin and pays its suppliers.
- **Identity:** Stylized **M** + Arc trajectory curve + USDC settlement accent point.

### Color Palette

| Token | Hex | Role |
|---|---|---|
| `bg` | `#0B1020` | Deep navy background |
| `primary` | `#2EE6D6` | Arc cyan |
| `usdc` | `#2775CA` | USDC brand accent |
| `profit` | `#B6F36A` | Positive margin / success |
| `warn` | `#FFB547` | Human escalation / pending approval |
| `danger` | `#FF6B6B` | Policy blocked / supplier failure |
| `text` | `#F5F7FA` | Primary clean text |

### Language & Vocabulary
- **Allowed:** Available to spend, Reserved, Gross margin, Agent decision, Policy blocked, Human approval required, Fulfilled, Supplier uncertain.
- **Forbidden:** «AI magic», «Autonomous money», «Guaranteed profit».

---

## 3. System Architecture

```text
Customer Storefront
        ↓
    Order API
        ↓
Payment Verifier ───── Arc USDC (0x3600...0000)
        ↓
  Policy Engine (Deterministic, No LLM Authority)
   ┌────┴─────┐
   ↓          ↓
Fulfillment  Approval Queue
   ↓          ↓
AppRoute    Seller Approval
   └────┬─────┘
        ↓
 Delivery Service
        ↓
Ledger + Audit Log
        ↓
  Seller Console
```

### 3.1 Storefront & Checkout with Onramp
- Full product catalogue (AppRoute SDK `client.services.list()`) with instant search and category filtering.
- Dual-mode checkout:
  1. **Direct Web3 Wallet:** оплата USDC на Arc напрямую с кошелька (MetaMask / OKX / Rabby / Circle DCW).
  2. **Card/Fiat Onramp:** встроенный **Arc App Kit Onramp widget** (`@circle-fin/app-kit`), позволяющий купить USDC на Arc картой/Apple Pay и автоматически оплатить заказ.
- Real-time order status tracking.
- Secure, authenticated delivery page (encrypted key reveal).

### 3.2 Order State Machine

**Strict valid transitions only:**
```text
CREATED
→ AWAITING_PAYMENT
→ PAYMENT_DETECTED
→ PAYMENT_CONFIRMED
→ POLICY_CHECK
→ APPROVED
→ PURCHASING
→ FULFILLED
```

**Failure / Exception States:**
```text
EXPIRED
PAYMENT_FAILED
UNDERPAID
DUPLICATE
BLOCKED
ESCALATED
SUPPLIER_UNKNOWN
REFUND_PENDING
REFUNDED
```

*Invariant: direct transition from `CREATED` to `FULFILLED` is impossible.*

### 3.3 Payment Verifier (Arc Testnet)
- Network: Arc Testnet (`chainId: 5042002`, `0x4CEF52`).
- Contract: `0x3600000000000000000000000000000000000000` (canonical Arc USDC).
- Decimals: **6 decimals** on ERC-20 view.
- Amounts: always 6-decimal integer units (`1.00 USDC = 1_000_000n`). No floating-point money.
- Verification checks:
  1. `chainId == 5042002`
  2. `token == 0x3600000000000000000000000000000000000000`
  3. `to == merchant_wallet_address`
  4. `amount >= order.price_usdc_units`
  5. Transaction receipt `status == 1` (success)
  6. Confirmations >= 1
  7. Order not expired (`now <= expires_at`)
  8. `tx_hash` not previously consumed (enforced via database uniqueness).

### 3.4 Policy Engine
Pure deterministic logic. Zero LLM authority over financial mutation.

```text
IF payment confirmed
   AND SKU enabled
   AND supplier available
   AND supplier cost <= sale price
   AND margin >= margin floor (bps)
   AND order amount <= auto-purchase limit
   AND daily spend + order <= daily limit
   AND post-purchase reserve >= reserve floor
THEN AUTO_APPROVE
ELSE IF margin < floor OR daily limit breached
THEN BLOCK
ELSE IF order amount > auto limit OR reserve breached
THEN ESCALATE (Require Human Approval)
```

### 3.5 Agent Boundary
- **LLM May:** explain decisions, summarize risk, suggest prices, explain delays to customer support.
- **LLM May NOT:** mutate ledger, sign transactions, approve payouts, retry unknown supplier purchases, change pricing limits.

```text
Agent Proposal → Schema Validation → Deterministic Policy Engine → Executor → Ledger/Audit
```

### 3.6 AppRoute Adapter
- Preflight balance and live price check before purchase.
- Every order generated with deterministic HMAC `request_ref`.
- Store supplier reference prior to processing delivery payload.
- On timeout/network error after POST:
  ```text
  POST sent -> Timeout/5xx -> Status: SUPPLIER_UNKNOWN
  -> Blind retry STRICTLY FORBIDDEN
  -> Background Reconciler queries by request_ref
  -> Resolves SUCCEEDED (deliver) or FAILED (alert/refund)
  ```

### 3.7 Ledger & Separate Accounts
Append-only ledger. SQLite triggers forbid `UPDATE` and `DELETE`.

**Accounts are strictly isolated (never blended into a single number):**
- `arc:usdc:available`
- `arc:usdc:reserved`
- `approute:usd:operating`
- `approute:usd:reserved`
- `revenue:usdc`
- `cogs:usd`
- `fees:usdc`
- `profit:usdc`

---

## 4. Core Database Schema

```sql
-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  supplier_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_usdc_units INTEGER NOT NULL, -- 6 decimals (1.00 = 1000000)
  enabled INTEGER NOT NULL DEFAULT 1,
  margin_floor_bps INTEGER NOT NULL DEFAULT 1500, -- 15%
  max_auto_purchase_usdc_units INTEGER NOT NULL DEFAULT 10000000, -- 10 USDC
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  customer_wallet TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sale_amount_usdc_units INTEGER NOT NULL,
  status TEXT NOT NULL,
  payment_tx_hash TEXT UNIQUE,
  supplier_reference TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'PENDING',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Supplier Purchases
CREATE TABLE supplier_purchases (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  supplier TEXT NOT NULL DEFAULT 'approute',
  supplier_reference TEXT UNIQUE,
  quoted_cost_cents INTEGER NOT NULL,
  actual_cost_cents INTEGER,
  status TEXT NOT NULL,
  raw_response_hash TEXT,
  encrypted_delivery_payload TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Decisions (Agent & Policy audit record)
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  decision TEXT NOT NULL, -- 'AUTO_APPROVED' | 'BLOCKED' | 'ESCALATED'
  reason_codes TEXT NOT NULL, -- JSON array
  policy_version TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  agent_summary TEXT,
  created_at INTEGER NOT NULL
);

-- Ledger Entries (Immutable)
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  account TEXT NOT NULL,
  amount_units INTEGER NOT NULL,
  currency TEXT NOT NULL, -- 'USDC' | 'USD'
  direction TEXT NOT NULL, -- 'DEBIT' | 'CREDIT'
  tx_hash TEXT,
  policy_version TEXT NOT NULL,
  decision_id TEXT REFERENCES decisions(id),
  created_at INTEGER NOT NULL
);

-- Approvals Queue
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  required_limit_units INTEGER NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL, -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  expires_at INTEGER NOT NULL,
  approved_at INTEGER,
  created_at INTEGER NOT NULL
);
```

---

## 5. Detailed Roadmap & Checkpoints

### Phase 0 — Preflight & Feasibility (Day 1: Sep 27)
- [ ] Confirm AppRoute API credentials & balance endpoint.
- [ ] Select 1st SKU with instant digital/code delivery.
- [ ] Confirm resale & delivery terms.
- [ ] Set up Arc Testnet merchant wallet (Circle DCW or test EOA).
- [ ] Fund wallet with testnet USDC from https://faucet.circle.com.
- [ ] Probe Arc USDC contract (`balanceOf` reading 6 decimals via viem).
- [ ] Perform 1 manual test purchase on AppRoute and verify delivery payload.
- **Checkpoint P0 (Gate G0):** Pass only if AppRoute purchase works, testnet USDC transfer is confirmed on Arc Explorer, and delivery payload is decryptable.

### Phase 1 — Project Foundation (Day 2: Sep 28)
- [ ] Repository structure, TypeScript/Node.js setup.
- [ ] Environment validation (`.env.example`, safe defaults).
- [ ] SQLite database migrations with strict triggers.
- [ ] Structured logger with secret/key redaction.
- [ ] Healthcheck endpoint (`GET /health`).
- **Checkpoint P1 (Gate G1):** `npm test`, `npm run build`, and migrations succeed cleanly from zero.

### Phase 2 — Catalogue & Orders (Days 3–4: Sep 29–30)
- [ ] Seed catalogue with tested AppRoute SKUs.
- [ ] Customer storefront UI (product list & details).
- [ ] `POST /orders` endpoint with unique ID, locked price snapshot, expiration TTL.
- [ ] Order state machine transition guards.
- [ ] Storefront order tracking view.
- **Checkpoint P2 (Gate G2):** Order creates with locked price snapshot, expires correctly, and resists duplicate creation.

### Phase 3 — Arc USDC Payment & App Kit Onramp Integration (Days 5–6: Oct 1–2)
- [ ] Arc Testnet viem client integration.
- [ ] Checkout payment instructions with `payment_ref` and QR/address.
- [ ] **Arc App Kit Onramp widget** embed (iframe/popup via `@circle-fin/app-kit`) for fiat card funding directly into Arc USDC.
- [ ] Onramp deposit listener & lifecycle events (settled deposit webhook).
- [ ] On-chain transaction poller/watcher.
- [ ] Server-side receipt validation (chain, recipient, exact 6-decimal units, block finality).
- [ ] Atomic transaction consumption (`UNIQUE(tx_hash)`).
- **Checkpoint P3 (Gate G3):** Both direct wallet transfer and Onramp card funding deposit confirmed USDC on Arc → verifier updates order to `PAYMENT_CONFIRMED`. Wrong amount or replayed tx rejected.

### Phase 4 — AppRoute Fulfilment & Safety (Days 7–8: Oct 3–4)
- [ ] `AppRouteClient` integration with preflight margin check.
- [ ] Idempotent purchase submission with HMAC reference.
- [ ] Supplier timeout handling (`SUPPLIER_UNKNOWN` state).
- [ ] Background reconciliation worker for unknown supplier orders.
- [ ] Encrypted delivery code storage.
- [ ] Secure delivery page for buyer.
- **Checkpoint P4 (Gate G4):** Paid order triggers AppRoute purchase, code is encrypted and displayed to buyer. Timeout triggers reconciliation without blind retry.

### Phase 5 — Policy Engine & Autonomous Agent (Days 9–10: Oct 5–6)
- [ ] Deterministic policy matrix (P1–P11).
- [ ] Margin gate, daily budget gate, reserve floor gate.
- [ ] Human approval queue for orders > `max_auto_purchase`.
- [ ] Agent decision logging with policy version and reason codes.
- [ ] SKU auto-pause when supplier price causes margin breach.
- **Checkpoint P5 (Gate G5):** Normal order auto-fulfills. Unprofitable order blocks without spending funds. Large order halts in approval queue.

### Phase 6 — Ledger & Seller Console (Days 11–12: Oct 7–8)
- [ ] Append-only ledger recording Revenue, COGS, Fees, Profit.
- [ ] Seller Console: Revenue, Balances, Margin %, Order feed, Approval queue.
- [ ] Decision Replay view: *"Why did the agent do this?"* (order → payment tx → policy checks → supplier order → delivery).
- **Checkpoint P6 (Gate G6):** Full audit trail replayable in UI. Explorer links resolve to live Arc transactions.

### Phase 7 — External Pilot & Traction (Day 13: Oct 9)
- [ ] Onboard 5+ external buyers from hackathon channels/community.
- [ ] Execute 10+ genuine Arc testnet USDC orders.
- [ ] Execute 1 intentionally blocked order (margin breach demonstration).
- [ ] Execute 1 human approval flow.
- [ ] Execute 1 supplier reconciliation demonstration.
- **Checkpoint P7 (Gate G7):** External user buys and receives product without developer intervention.

### Phase 8 — Hardening, Video & Submission (Day 14: Oct 10)
- [ ] Code freeze, clean repo, zero secret leaks.
- [ ] README with quickstart, architecture diagram, policy matrix.
- [ ] Record <3 minute demonstration video.
- [ ] Verify live storefront and seller console deployment on `mercenta.xyz`.
- [ ] Submit before deadline (Oct 10, 11:59 PM ET).
- **Checkpoint P8 (Gate G8):** Submission complete with all URLs and video proof.

---

## 6. Comprehensive Test Plan

### A. Unit Tests: Money & Pricing
- [ ] USDC 6-decimal scaling (`1.00 USDC = 1_000_000n`).
- [ ] Rejection of floating-point arithmetic in financial functions.
- [ ] Basis points margin calculation (`margin_bps = ((sale - cost) * 10000) / sale`).
- [ ] Zero cost / zero price handling (reverts safely).
- [ ] Overflow / negative input rejection.

### B. Unit Tests: Policy Engine
- [ ] Valid payment, positive margin, safe reserve → `AUTO_APPROVE`.
- [ ] Cost > sale price → `BLOCK` with `MARGIN_NEGATIVE`.
- [ ] Margin < floor bps → `BLOCK` with `MARGIN_BELOW_FLOOR`.
- [ ] Amount > auto-purchase limit → `ESCALATE` with `ABOVE_AUTO_LIMIT`.
- [ ] Daily spend limit exceeded → `BLOCK` with `DAILY_LIMIT_EXCEEDED`.
- [ ] Post-purchase liquidity < floor → `BLOCK` with `LIQUIDITY_FLOOR_BREACH`.
- [ ] Disabled SKU → `BLOCK` with `SKU_DISABLED`.
- [ ] Stale quote (> TTL) → `BLOCK` with `STALE_SUPPLIER_QUOTE`.
- [ ] Replayed payment tx → `BLOCK` with `PAYMENT_ALREADY_USED`.

### C. Unit Tests: Order State Machine
- [ ] Valid forward flow passes.
- [ ] Cannot jump from `CREATED` to `FULFILLED`.
- [ ] `EXPIRED` order rejects payment confirmation.
- [ ] `BLOCKED` order cannot trigger supplier purchase.
- [ ] Idempotent repeated state calls return cleanly.

### D. Integration Tests: Payment Verifier (Viem / Mock Chain)
- [ ] Wrong chain ID rejected.
- [ ] Non-USDC token address rejected.
- [ ] Recipient mismatch rejected.
- [ ] Underpaid amount rejected.
- [ ] Overpaid amount accepted (order fulfilled, surplus recorded).
- [ ] Unmined / pending transaction rejected until confirmed.
- [ ] Duplicate `tx_hash` rejected by database unique constraint.

### E. Integration Tests: AppRoute Supplier
- [ ] Successful quote and purchase returns valid code.
- [ ] Insufficient supplier balance marks order as `ESCALATED` with alert.
- [ ] Network timeout after POST sets `SUPPLIER_UNKNOWN`.
- [ ] **Critical Invariant:** On `SUPPLIER_UNKNOWN`, blind retry count is 0, reconciliation queries supplier reference.
- [ ] Circuit breaker opens after 3 consecutive supplier 5xx errors.

### F. Integration Tests: Ledger & Auditing
- [ ] Append-only invariant: `UPDATE` on `ledger_entries` throws SQLite error.
- [ ] `DELETE` on `ledger_entries` throws SQLite error.
- [ ] Financial balance invariant: `Revenue - COGS - Fees == Gross Profit`.
- [ ] Every entry links to `order_id` and `policy_version`.

### G. Security Verification
- [ ] Secrets check: `.env`, private keys, Circle entity secrets absent from Git tree.
- [ ] Delivery payload encrypted in database; decrypted only via authenticated customer token.
- [ ] Seller console endpoints protected by session authentication.
- [ ] No customer can inspect another customer's order or delivery code.

---

## 7. Definition of Done (DoD)

The project is complete and ready for submission when:
1. An external user can open `mercenta.xyz`, connect wallet, pay testnet USDC on Arc, and receive their digital product code.
2. Payment is validated server-side on Arc blockchain before any supplier action.
3. The policy engine autonomously decides ALLOW / BLOCK / ESCALATE without human intervention for standard orders.
4. An intentional price hike causes the agent to automatically block an unprofitable order, moving zero funds.
5. A high-value order generates a human approval request in the seller console, executing only after click.
6. A simulated supplier timeout triggers automated reconciliation without double purchase.
7. Double-entry / append-only ledger logs revenue, COGS, fees, and profit with live Arc transaction explorer hashes.
8. Submission includes a clean public GitHub repo, 3-minute video demo, and verifiable live deployment.
