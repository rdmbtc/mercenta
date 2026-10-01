# Mercenta Project Guidelines

@./DESIGN.md

## 1. Project Overview & Architecture
Mercenta (`mercenta.xyz`) is the Autonomous Commerce OS for AI Agents. It provides deterministic policy gates, escrow/liquidity reservation, and instant USDC settlement on Arc / Base / Solana for agent-driven commerce.

## 2. Design System Authority
All frontend engineering, components, tokens, and layouts MUST strictly follow `@./DESIGN.md`:
- **Palette**: HashiCorp Infrastructure Palette on `#000000` canvas with `#15181e` / `#1f232b` elevation tiers.
- **Chromatic Identity Tokens**:
  - `domain-policy-enclave` (`#7b42bc`): Deterministic policy engine & gate verification.
  - `domain-cleared-settlement` (`#00ca8e`): Cleared intents & instant USDC settlement.
  - `domain-liquidity-reserve` (`#ffcf25`): Escrow, reserved liquidity & human approval.
  - `domain-policy-blocked` (`#e62b1e`): Policy blocks, risk gates & margin breaches.
  - `domain-agent-telemetry` (`#14c6cb`): Real-time intent feeds & telemetry.
  - `domain-developer-rails` (`#1868f2`): Developer SDK & gateway routing.
  - `domain-hardware-boundary` (`#f24c53`): Hardware enclave boundary & cryptographic receipts.
- **Typography**: 300-weight Whisper Display Serif headlines (80–96px, line-height ≤1.00), Neo-Grotesque sans UI, and uppercase tracked monospace (`JetBrains Mono`, `0.182em` tracking) for eyebrows and readouts.
- **Corner Radii**: 30px for feature category cards (`rounded-card-large`), 8px for buttons/inputs/terminals (`rounded-md`).
- **Anti-Slop**: NO purple radial slop gradients, NO generic drop shadows on black surfaces, NO bold 700-weight display titles, NO rainbow color clashes.

## 3. Strict Supplier Protection & Categorization
- **CONFIDENTIALITY**: The supplier name `Wholesale Provider` MUST NEVER appear anywhere in public code, UI text, commits, or documentation.
- All digital goods MUST be presented under Mercenta's 5 institutional categories:
  1. `Gaming Keys & Platform Vouchers` (Steam, PlayStation, Xbox, Epic, Riot, Blizzard)
  2. `Streaming & Media Subscriptions` (Streaming video & audio services)
  3. `Creator & Game Micro-Donations` (Agent micro-transactions & stream tips)
  4. `Developer API & Token Bundles` (Wholesale AI credit pools)
  5. `Cloud Compute & GPU Vouchers` (Dedicated H100/A100 instances)

## 4. Frontend References & Component Tooling
When creating new components or pages, follow this order:
1. **Existing Design System**: Always follow `@./DESIGN.md` tokens first.
2. **21st.dev MCP (`21st`)**: Query the 21st MCP for modern Tailwind/React primitives (Hero, Bento Grid, Ticker, Terminal). Announce what you are searching for before invoking.
3. **Component Gallery**: Inspect `component.gallery` to verify how mature enterprise design systems handle the component.
4. **Spring Physics & Animations**: Reference `kinetics.colorion.co` for spring configurations (stiffness, damping, mass) or GSAP ScrollTrigger.
5. **Quality Review**: Audit final output with `impeccable` (`polish`, `distill`) and ensure static export builds without error (`npm --prefix web run build`).
