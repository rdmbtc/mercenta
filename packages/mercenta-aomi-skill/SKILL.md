---
name: mercenta-commerce
description: "Autonomous digital goods checkout and treasury management engine on Arc Network. Enables AI agents in Aomi, Claude Code, Cursor, and Hermes to browse wholesale digital inventory, validate orders against the 5-Gate Policy Engine, settle on Arc Mainnet, sweep idle treasury into yield vaults, and execute multi-chain liquidity top-ups."
version: 1.0.0
risk_tier: L2
homepage: "https://mercenta.xyz"
repository: "https://github.com/rdmbtc/mercenta"
chains:
  - id: 5042
    name: "Arc Mainnet"
    currency: "USDC"
---

# Mercenta Commerce & Treasury Skill for Aomi

Mercenta is the autonomous commerce and treasury infrastructure built on Arc Network (Chain 5042). This skill gives Aomi agents and conversational assistants direct access to Mercenta's 5-Gate Policy Engine, wholesale digital goods catalog, automated treasury sweeping, and multi-chain liquidity routing.

## Capabilities & Tools

### 1. `mercenta_catalog`
Query real-time wholesale digital inventory across institutional categories.
- **Input Parameters**:
  - `category` *(optional)*: `"gaming"`, `"streaming"`, `"compute"`, `"tokens"`, `"donations"`, or `"all"`
  - `query` *(optional)*: Search keyword (e.g. `"steam"`, `"playstation"`, `"gpu"`, `"api"`)
  - `max_price_usdc` *(optional)*: Budget ceiling filter in USDC
- **Output**: Array of validated items, available denominations, wholesale costs, margin spreads, and delivery SLA.

### 2. `mercenta_quote`
Evaluate an order through the deterministic **5-Gate Policy Engine** before spending.
- **Input Parameters**:
  - `product_id`: Identifier of the catalog product
  - `denomination_usdc`: Requested face value / amount
  - `max_slippage_bps` *(optional)*: Allowed price deviation in basis points
- **Gates Verified**:
  1. *Available Spend Cap*: Verifies agent spending quota.
  2. *Reserve Floor*: Ensures operating liquidity stays intact.
  3. *Gross Margin Floor*: Guarantees profitability (minimum +15%).
  4. *Catalog & Vendor Verification*: Confirms supplier SLA and stock.
  5. *Auto-Approval Threshold*: Auto-approves under $100 USDC; flags higher amounts for owner co-sign.
- **Output**: Policy decision (`"CLEARED"`, `"BLOCKED"`, or `"REQUIRE_ESCALATION"`), breakdown of platform fee and margin, and simulation hash.

### 3. `mercenta_checkout`
Execute checkout on Arc Mainnet via `MercentaCheckout.sol` (`0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed`).
- **Input Parameters**:
  - `quote_id`: Approved quote token from `mercenta_quote`
  - `recipient_address` *(optional)*: EVM address for receipt delivery (defaults to caller)
  - `auto_claim` *(boolean)*: Whether to immediately decrypt and return the digital activation voucher
- **Output**: Transaction hash on ArcScan, 6-decimal USDC receipt, and encrypted delivery payload.

### 4. `mercenta_treasury_sweep`
Autonomous yield sweeper (RFB 01 Intelligent Business Treasury) that allocates idle merchant revenue into Arc Morpho / USYC vaults.
- **Input Parameters**:
  - `reserve_floor_usdc`: Operational cash buffer to leave untouched (e.g. 50.0)
  - `vault_id` *(optional)*: Target vault (default: `"galaxy-usdc"` on Arc Morpho Blue)
  - `simulate_only` *(boolean)*: Simulate yield projections without on-chain execution
- **Output**: Amount swept, net variable APY, transaction receipt, and updated treasury breakdown.

### 5. `mercenta_crosschain_topup`
Generate cross-chain deposit routes and addresses to fund an Arc wallet from external chains.
- **Input Parameters**:
  - `source_chain`: `"base"`, `"solana"`, `"arbitrum"`, `"ethereum"`, `"polygon"`
  - `amount_usdc`: Amount to bridge
  - `arc_destination_wallet`: Target Arc EVM address
- **Output**: Deposit address, route protocol (CCTP V2 / LiFi), estimated time, gas cost, and confirmation monitor URL.

---

## Agent Operation Rules

1. **Never bypass Policy Engine**: A model may propose a purchase, but `mercenta_quote` MUST return `"CLEARED"` before `mercenta_checkout` is executed.
2. **Deterministic Settlement**: All fees and splits settle in native 6-decimal USDC on Arc Mainnet. No gas tokens (ETH/SOL) are needed for settlement on Arc.
3. **Audit Trail**: Every transaction produces a hash-chained receipt verifiable on `explorer.arc.io` / `arcscan.app`.
