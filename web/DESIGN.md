---
version: 1.0.0
name: Mercenta-Design-System
description: "The authoritative design specification for Mercenta — the Autonomous Commerce OS for AI Agents. A synthesis of HashiCorp's uncompromising enterprise infrastructure color system with Origin Financial's nocturnal gallery aesthetic, whisper-weight editorial typography, and high-precision data readouts. Built on pure black canvas (#000000), charcoal elevation tiers, and deterministic per-domain chromatic tokens."

colors:
  # Canvas & Base Surfaces
  canvas: "#000000"
  surface-1: "#15181e"
  surface-2: "#1f232b"
  surface-3: "#3b3d45"
  hairline: "#3b3d45"
  hairline-soft: "#252830"
  hairline-translucent: "rgba(178, 182, 189, 0.10)"
  
  # Actions & High Contrast
  primary: "#ffffff"
  on-primary: "#000000"
  inverse-canvas: "#ffffff"
  inverse-ink: "#000000"
  accent-blue: "#2b89ff"
  accent-blue-deep: "#101a59"

  # Ink & Typography
  ink: "#ffffff"
  ink-cloud: "#f5f5f7"
  ink-muted: "#b2b6bd"
  ink-subtle: "#656a76"

  # Mercenta Domain Chromatic Identity Tokens (HashiCorp Palette)
  domain-policy-enclave: "#7b42bc"        # Terraform Purple: Policy Engine, Enclave Verification
  domain-policy-bright: "#911ced"         # Terraform Bright: Highlight states, active policy gates
  domain-liquidity-reserve: "#ffcf25"     # Vault Yellow: Escrow, Reserved Liquidity, Human Approval
  domain-cleared-settlement: "#00ca8e"    # Nomad Green: Cleared Intents, Instant USDC Settlement
  domain-policy-blocked: "#e62b1e"        # Consul Red: Policy Blocked, Margin Breaches, Risk Gates
  domain-agent-telemetry: "#14c6cb"       # Waypoint Cyan: Agent Intent Feed, Nanopayments, Verification
  domain-agent-telemetry-deep: "#12b6bb"  # Waypoint Deep: Interactive states on telemetry
  domain-developer-rails: "#1868f2"       # Vagrant Blue: Supplier Rails, Developer SDK, API Bundles
  domain-hardware-boundary: "#f24c53"     # Boundary Coral: Hardware Enclaves, Cryptographic Receipts

  # Semantic States
  semantic-success: "#00ca8e"
  semantic-warning: "#ffcf25"
  semantic-error: "#e62b1e"
  semantic-visited: "#a737ff"
  amber-100: "#fbeabf"
  amber-200: "#bb5a00"

  # Inverted Accent Surface
  surface-inverted: "#cacaca"
  on-surface-inverted: "#000000"

typography:
  display-xl:
    fontFamily: var(--font-display)
    fontSize: 96px
    fontWeight: 300
    lineHeight: 0.90
    letterSpacing: -2.5px
  display-lg:
    fontFamily: var(--font-display)
    fontSize: 80px
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: -2.0px
  display-md:
    fontFamily: var(--font-display)
    fontSize: 56px
    fontWeight: 300
    lineHeight: 1.00
    letterSpacing: -1.2px
  headline:
    fontFamily: var(--font-display)
    fontSize: 38px
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: -0.8px
  subhead-lg:
    fontFamily: var(--font-sans)
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: -0.2px
  subhead:
    fontFamily: var(--font-sans)
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.50
    letterSpacing: 0
  body:
    fontFamily: var(--font-sans)
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: var(--font-sans)
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  mono-data:
    fontFamily: var(--font-mono)
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0.015em
  mono-label:
    fontFamily: var(--font-mono)
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.80
    letterSpacing: 0.080em
  mono-eyebrow:
    fontFamily: var(--font-mono)
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: 0.182em
  button:
    fontFamily: var(--font-sans)
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  card-large: 30px
  pill: 9999px

spacing:
  hair: 1px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  hero-pad: 90px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.inverse-canvas}"
    textColor: "{colors.inverse-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-glass:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    backdropFilter: "blur(24px)"
    borderColor: "rgba(255, 255, 255, 0.12)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
  feature-card:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline-translucent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  category-tile-policy:
    backgroundColor: "{colors.domain-policy-enclave}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  category-tile-settlement:
    backgroundColor: "{colors.domain-cleared-settlement}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  category-tile-liquidity:
    backgroundColor: "{colors.domain-liquidity-reserve}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  category-tile-telemetry:
    backgroundColor: "{colors.domain-agent-telemetry}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  category-tile-rails:
    backgroundColor: "{colors.domain-developer-rails}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  inverted-stat-card:
    backgroundColor: "{colors.surface-inverted}"
    textColor: "{colors.on-surface-inverted}"
    rounded: "{rounded.card-large}"
    padding: "32px"
  agent-intent-input:
    backgroundColor: "{colors.canvas}"
    borderColor: "rgba(255, 255, 255, 0.10)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px 10px 24px"
  pill-badge:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    borderColor: "rgba(255, 255, 255, 0.12)"
    textColor: "{colors.ink-cloud}"
    typography: "{typography.mono-eyebrow}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  telemetry-row:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline-soft}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mono-data}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
---

# Mercenta — Design System Reference
> **The Nocturnal Vault of Autonomous Commerce.** A hushed, near-black architecture where whisper-soft authority display headlines meet HashiCorp's uncompromising infrastructure palette and high-precision cryptographic receipts.

**Theme:** Dark (Pure Black Canvas `#000000`)  
**Product Positioning:** Autonomous Commerce OS for AI Agents — Deterministic Policy Gateways, Instant USDC Settlement, and Hardware Verification Rails.

---

## 1. Executive Summary & Design Ethos

Mercenta redefines agentic commerce as an enterprise-grade financial engine. It intentionally rejects the "generic SaaS slop" trope (vibrant purple radial glows, Inter-only typography, floating cards with heavy blurred dropshadows). Instead, Mercenta merges two powerful paradigms:

1. **HashiCorp's Infrastructure Color System**: An uncompromising near-black foundation (`#000000` canvas, charcoal elevation tiers, and 1px translucent hairlines) held together by **per-domain chromatic tokens** (Terraform violet, Vault amber, Nomad emerald, Waypoint cyan, Vagrant cobalt, Consul crimson, and Boundary coral). Colors are never decorative whims; they are strict identity signals denoting which enclave, gate, or rail is active.
2. **Origin Financial's Editorial Elegance & Precision**: Whisper-weight serif display headlines (300 weight, 80–96px, 0.90 line-height) that communicate authority through restraint rather than bombastic weight; a tripartite typographic hierarchy; comfortable 30px-radius chromatic category tiles; and monospaced cryptographic micro-readouts (`Roboto Mono` / `JetBrains Mono` with wide tracking).

White-on-black (`#ffffff` on `#000000`, 21:1 AAA contrast) is the singular primary action trigger. The interface remains quiet, dark, and math-driven.

---

## 2. Color System (HashiCorp Infrastructure Palette)

### 2.1 Base Canvas & Surface Elevation
On dark canvases, depth is achieved through **surface stepping** and **1px translucent hairlines**, never fuzzy drop shadows.

| Surface | Hex | Role | Contrast / Usage |
|---|---|---|---|
| **Canvas** | `#000000` | Universal page ground | Deepest ground. Hero, page backdrop, footer, terminal housing. |
| **Surface 1** | `#15181e` | Base card elevation | Default feature cards, ledger cells, policy containers. |
| **Surface 2** | `#1f232b` | Interactive raised surface | Hovered cards, secondary buttons, active tab pill containers. |
| **Surface 3** | `#3b3d45` | High-contrast chips | Small technical badges, sub-nav bars, input borders. |
| **Hairline** | `#3b3d45` | Primary structural edge | 1px border on inputs, cards, and modal boundaries. |
| **Hairline Soft** | `#252830` | Subdued separator | Table rows, code line dividers, ledger interconnects. |
| **Hairline Translucent** | `rgba(178,182,189,0.10)` | Atmospheric border | The signature card edge — felt rather than seen. |
| **Surface Inverted** | `#cacaca` | High-contrast spotlight | Stat blocks and institutional proof tiles breaking the dark rhythm. |

### 2.2 Text & Ink Tokens
Strict contrast standards ensure flawless legibility across terminal views and editorial copy:

| Token | Hex | Role | Typography Application |
|---|---|---|---|
| **Ink** | `#ffffff` | Primary text | Headlines, primary buttons, critical data values. |
| **Ink Cloud** | `#f5f5f7` | Soft display text | Display titles where pure `#ffffff` is too glaring at 96px. |
| **Ink Muted** | `#b2b6bd` | Secondary text | Body descriptions, metadata, ledger timestamps, unit notes. |
| **Ink Subtle** | `#656a76` | Tertiary / Micro-copy | Code comments, inactive statuses, input helper hints. |
| **Inverse Ink** | `#000000` | On-light text | Text on white buttons, inverted stat cards, and amber/green tiles. |

### 2.3 Mercenta Domain Identity Tokens (HashiCorp Signature)
Each functional rail and policy phase in Mercenta maps directly to a canonical HashiCorp infrastructure token:

```
┌────────────────────────────────────────────────────────────────────────┐
│               MERCENTA DOMAIN CHROMATIC ARCHITECTURE                   │
├──────────────────────────┬───────────────────────────┬─────────────────┤
│ Domain Module            │ HashiCorp Origin Token    │ Hex Code        │
├──────────────────────────┼───────────────────────────┼─────────────────┤
│ Policy Enclave & Gate    │ Terraform Purple          │ #7b42bc         │
│ Active Gate Highlight    │ Terraform Bright          │ #911ced         │
│ Liquidity & Escrow       │ Vault Yellow              │ #ffcf25         │
│ Cleared Settlement       │ Nomad Green / Success     │ #00ca8e         │
│ Policy Blocked / Circuit │ Consul Red / Error        │ #e62b1e         │
│ Agent Telemetry & Stream │ Waypoint Cyan             │ #14c6cb         │
│ Telemetry Deep (Active)  │ Waypoint Deep             │ #12b6bb         │
│ Developer & Supplier SDK │ Vagrant Blue / Accent     │ #1868f2 / #2b89 │
│ Hardware Boundary        │ Boundary Coral            │ #f24c53         │
└──────────────────────────┴───────────────────────────┴─────────────────┘
```

#### Behavioral Rules for Chromatic Tokens:
- **Identity, Not Decoration**: Use a chromatic color on a card or button *only* when that component represents that specific domain (e.g., `#7b42bc` for Policy rules; `#ffcf25` for Liquidity/Escrow; `#00ca8e` for Cleared Orders).
- **No Palette Clashing**: Never mix multiple chromatic accents within the same small component. A single card represents a single enclave.
- **Contrast Adaptation**: Light chromatic surfaces (`#ffcf25` Vault Yellow, `#00ca8e` Nomad Green, `#14c6cb` Waypoint Cyan) take `textColor: #000000` (Inverse Ink). Deep chromatic surfaces (`#7b42bc` Terraform Purple, `#1868f2` Vagrant Blue) take `textColor: #ffffff` (Ink).

---

## 3. Typographic System (Tripartite Voice)

Mercenta uses a three-voice typographic architecture that unites high-fashion editorial authority with technical machine precision:

```
[Voice 1: Editorial Authority]   ──►  Whisper Display (Lyon Display / DM Serif Display @ 300)
[Voice 2: Functional Interface]  ──►  Neo-Grotesque (Suisse Int'l / Geist Sans / Inter @ 400-600)
[Voice 3: Cryptographic Data]    ──►  Engineered Mono (Roboto Mono / JetBrains Mono @ 400-600)
```

### 3.1 Type Scale Specification

| Token | Family | Weight | Size | Line Height | Letter Spacing | Context / Usage |
|---|---|---|---|---|---|---|
| `--text-display-xl` | Display Serif | 300 | 96px | 0.90 | -2.5px | Flagship hero headline, cinematic openers |
| `--text-display-lg` | Display Serif | 300 | 80px | 0.95 | -2.0px | Section flagship headers |
| `--text-display-md` | Display Serif | 300 | 56px | 1.00 | -1.2px | Major module headlines |
| `--text-headline` | Display Serif | 300 | 38px | 1.05 | -0.8px | Chromatic card titles, modal titles |
| `--text-subhead-lg` | Sans | 400 | 20px | 1.40 | -0.2px | Hero subhead, architectural introductions |
| `--text-subhead` | Sans | 300 | 18px | 1.50 | 0.0px | Lead body, card descriptions |
| `--text-body` | Sans | 400 | 16px | 1.55 | 0.0px | Core UI text, form labels, documentation |
| `--text-body-sm` | Sans | 400 | 14px | 1.65 | 0.0px | Secondary descriptions, footer links |
| `--text-button` | Sans | 600 | 14px | 1.25 | 0.0px | Button actions, segmented control pills |
| `--text-mono-data` | Monospace | 500 | 14px | 1.40 | +0.015em | Terminal values, USDC amounts, tx hashes |
| `--text-mono-label` | Monospace | 500 | 12px | 1.80 | +0.080em | Status badges, parameter headers |
| `--text-mono-eyebrow`| Monospace | 600 | 11px | 1.20 | +0.182em | Uppercase tracked section category labels |

### 3.2 Typographic Principles
1. **The 300-Weight Display Anti-Convention**: Never bold display titles. Authority is achieved at 80–96px through whisper-light restraint (weight 300) and ultra-tight vertical leading (0.90).
2. **Selective Italic Accentuation**: In display headlines, italicize an operative action verb (e.g., *"Commerce, with control"* or *"Propose. Evaluate. Settle."*) to introduce subtle editorial tension.
3. **The 0.182em Monospace Eyebrow**: Every section begins with a positive-tracked uppercase monospace eyebrow label (e.g., `01 // POLICY GATEWAY`, `02 // LIQUIDITY ESCROW`).
4. **No Mid-Tone Gray Drift**: Text colors strictly stick to `#ffffff`, `#f5f5f7`, `#b2b6bd`, and `#656a76`.

---

## 4. Spacing, Shapes & Depth

### 4.1 Spacing Rhythm (Base Unit: 4px / Primary Increment: 8px)
- **Micro Tokens**: `xxs` (4px), `xs` (8px), `sm` (12px), `md` (16px), `lg` (24px)
- **Macro Tokens**: `xl` (32px), `xxl` (48px), `hero-pad` (90px), `section` (96px)
- **Standard Rhythms**:
  - Button padding: `10px 18px`
  - Input padding: `10px 18px 10px 24px` (generous left margin for prompt cursor)
  - Card padding: `32px` on feature cards; `48px` on flagship CTA banners; `90px` internal padding on hardware mockup stages
  - Section vertical rhythm: `96px` fixed gap between flagship page segments

### 4.2 Border Radius Scale
- `rounded.xs` (4px): Small terminal tags, code block indicators
- `rounded.sm` (6px): Monospace telemetry pills, data chips
- `rounded.md` (8px): **Standard UI unit** — buttons, form inputs, nav items, search bars (preserves the engineered, non-consumer feel)
- `rounded.lg` (12px): Sub-module panels, dialogs, dropdown menus
- `rounded.xl` (16px): Technical module cards, ledger containers
- `rounded.card-large` (30px): **Signature Feature Category Cards** and inverted stat blocks
- `rounded.pill` (9999px): Eyebrow badges, status indicator pills

### 4.3 Depth & Elevation Treatment
- **Flat Surface Stepping**: Surfaces step `#000000` (Canvas) → `#15181e` (Surface-1) → `#1f232b` (Surface-2).
- **1px Hairline Edge**: Every card has a `1px solid rgba(178, 182, 189, 0.10)` border.
- **Glassmorphism**: Fixed headers and floating consoles use `backdrop-filter: blur(24px)` with `background: rgba(0, 0, 0, 0.75)` and `border-bottom: 1px solid rgba(255, 255, 255, 0.08)`.
- **Zero Drop Shadows**: No blurred box-shadows on cards. Cards lift through tonal shift, not shadows.

---

## 5. Component Specifications

### 5.1 Primary Action Button (`button-primary`)
- **Visuals**: Pure white `#ffffff` background, pure black `#000000` text, 21:1 AAA contrast.
- **Geometry**: 8px border-radius (`rounded.md`), `10px 18px` padding, 14px font size, 600 weight.
- **Icon**: Trailing right arrow `→` with 8px margin.
- **States**:
  - Hover: Opacity 0.92, transform `translateY(-1px)`, transition `0.2s ease`.
  - Pressed: Opacity 0.85, transform `translateY(0)`.

### 5.2 Ghost & Glass Navigation Buttons (`button-ghost` / `button-glass`)
- **Ghost**: Transparent fill, `1px solid #3b3d45` border, white text, 8px radius.
- **Glass**: `rgba(255, 255, 255, 0.08)` fill, `backdrop-filter: blur(24px)`, `1px solid rgba(255, 255, 255, 0.12)` border. Used for navigation controls and floating toggles.

### 5.3 Feature Category Cards (Signature Chromatic Modules)
- **Role**: Full-bleed chromatic tiles representing the 5 institutional digital product families and policy pillars.
- **Geometry**: 30px border-radius (`rounded.card-large`), `32px` interior padding, 0px border.
- **Variants**:
  1. **Policy Enclave Tile**: `#7b42bc` (Terraform Purple) ground, white text. Holds display title (38px/300) and monospace rule readout.
  2. **Cleared Settlement Tile**: `#00ca8e` (Nomad Green) ground, black text. Holds instant USDC clearing proof.
  3. **Liquidity Escrow Tile**: `#ffcf25` (Vault Yellow) ground, black text. Holds spend floor and reserve meters.
  4. **Agent Telemetry Tile**: `#14c6cb` (Waypoint Cyan) ground, black text. Holds live intent streaming data.
  5. **Developer & Supplier Rails Tile**: `#1868f2` (Vagrant Blue) ground, white text. Holds SDK execution snippet.
  6. **Hardware Enclave Tile**: `#f24c53` (Boundary Coral) ground, white text. Holds cryptographic receipt verification.

### 5.4 Inverted Stat Spotlight Card (`inverted-stat-card`)
- **Role**: Breaks the nocturnal dark rhythm to spotlight institutional metric proof.
- **Visuals**: `#cacaca` (Silver) or `#ffffff` ground, `#000000` text.
- **Geometry**: 30px border-radius, `32px` padding.
- **Typography**: 38px/300 Lyon Serif title + 14px monospace metric badge. Maximum 1–2 instances per page.

### 5.5 Agent Intent & Policy Terminal Input (`agent-intent-input`)
- **Role**: Natural language query and agent policy evaluation field.
- **Visuals**: Pure black `#000000` background, `1px solid rgba(255, 255, 255, 0.12)` border, white `#ffffff` text, `#656a76` placeholder.
- **Geometry**: 8px border-radius, asymmetric padding: `10px 18px 10px 24px` (generous left indent for command cursor).
- **Affordance**: Circular submit action: 32px diameter, `rgba(255, 255, 255, 0.15)` fill, white arrow icon.

### 5.6 Telemetry & Ledger Rows (`telemetry-row`)
- **Role**: Monospace append-only audit trail entries (Intent → Check → Authorise → Settle).
- **Visuals**: `#15181e` background, `1px solid #252830` border, `#b2b6bd` monospace text.
- **Badges**:
  - `pass` / `cleared`: `#00ca8e` Nomad Green dot + text.
  - `fail` / `blocked`: `#e62b1e` Consul Red dot + text.
  - `hold` / `approval`: `#ffcf25` Vault Yellow dot + text.

### 5.7 Hardware Mockup Framing Module (`hardware-stage`)
- **Role**: Presentation container for cryptographic enclaves and vault hardware renders.
- **Visuals**: `#15181e` background, `1px solid rgba(178, 182, 189, 0.10)` border.
- **Geometry**: 16px border-radius, dramatic **90px padding on all sides** (`spacing.hero-pad`). Signals premium institutional hardware security.

---

## 6. Gradients & Atmospheric System

Mercenta uses exactly two structural gradients. Decorative multi-color rainbow or violet SaaS gradients are strictly prohibited.

1. **Machined Dark Chrome Gradient**:
   ```css
   background: linear-gradient(135deg, rgb(43, 43, 44) 0%, rgb(19, 19, 19) 100%);
   ```
   *Usage*: Applied to device bezels, terminal top bars, and metallic border accents. Simulates matte CNC-machined titanium under studio lighting.

2. **Deep Vault Horizon Gradient**:
   ```css
   background: linear-gradient(180deg, #000000 0%, #090a0d 45%, #101a59 100%);
   ```
   *Usage*: Sits exclusively behind the hero section to ground the 3D vault perspective without washing out typography.

---

## 7. Motion Philosophy & Micro-Interactions

Motion in Mercenta is calibrated to feel engineered, predictable, and exact:

- **Quick State Feedback**: `0.20s ease` on `background-color`, `border-color`, and `transform`. Instantaneous tactile response.
- **Atmospheric Reveal**: `2.2s cubic-bezier(0.455, 0.030, 0.515, 0.955)` for entering hero typography and vault models.
- **Border Trace Telemetry**: Named keyframe `telemetryTrace` that sweeps a 1px border stroke around active policy gates to indicate live evaluation.
- **No Spring Bounces**: Never use bouncy springs, rubber-band overshoots, or disorienting parallax tilts.

---

## 8. Implementation Code: CSS Custom Properties & Tailwind v4

### 8.1 Vanilla CSS Tokens (`globals.css`)

```css
:root {
  /* ==========================================================================
     Mercenta Design System Tokens
     Color System: HashiCorp Infrastructure Palette
     Typography & Layout: Origin Editorial Precision
     ========================================================================== */

  /* Canvas & Surfaces */
  --color-canvas: #000000;
  --color-surface-1: #15181e;
  --color-surface-2: #1f232b;
  --color-surface-3: #3b3d45;
  --color-hairline: #3b3d45;
  --color-hairline-soft: #252830;
  --color-hairline-translucent: rgba(178, 182, 189, 0.10);
  
  /* Inks */
  --color-ink: #ffffff;
  --color-ink-cloud: #f5f5f7;
  --color-ink-muted: #b2b6bd;
  --color-ink-subtle: #656a76;
  --color-inverse-canvas: #ffffff;
  --color-inverse-ink: #000000;

  /* Mercenta Chromatic Identity (HashiCorp) */
  --color-domain-policy: #7b42bc;         /* Terraform Purple */
  --color-domain-policy-bright: #911ced;  /* Terraform Bright */
  --color-domain-liquidity: #ffcf25;      /* Vault Yellow */
  --color-domain-cleared: #00ca8e;        /* Nomad Green */
  --color-domain-blocked: #e62b1e;        /* Consul Red */
  --color-domain-telemetry: #14c6cb;      /* Waypoint Cyan */
  --color-domain-telemetry-deep: #12b6bb; /* Waypoint Deep */
  --color-domain-rails: #1868f2;          /* Vagrant Blue */
  --color-domain-boundary: #f24c53;       /* Boundary Coral */
  --color-accent-blue: #2b89ff;
  --color-accent-navy: #101a59;

  /* Inverted Surface */
  --color-surface-inverted: #cacaca;
  --color-on-surface-inverted: #000000;

  /* Typography Font Families */
  --font-display: "Lyon Display", "DM Serif Display", serif;
  --font-sans: "Suisse Int'l", "Geist Sans", "Inter", -apple-system, sans-serif;
  --font-mono: "Roboto Mono", "JetBrains Mono", monospace;

  /* Typographic Scale */
  --text-display-xl: 96px;
  --leading-display-xl: 0.90;
  --text-display-lg: 80px;
  --leading-display-lg: 0.95;
  --text-display-md: 56px;
  --leading-display-md: 1.00;
  --text-headline: 38px;
  --leading-headline: 1.05;
  --text-subhead-lg: 20px;
  --leading-subhead-lg: 1.40;
  --text-subhead: 18px;
  --leading-subhead: 1.50;
  --text-body: 16px;
  --leading-body: 1.55;
  --text-body-sm: 14px;
  --leading-body-sm: 1.65;
  --text-mono-data: 14px;
  --text-mono-label: 12px;
  --text-mono-eyebrow: 11px;

  /* Spacing Scale */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-90: 90px;
  --spacing-96: 96px;

  /* Border Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-card-large: 30px;
  --radius-pill: 9999px;

  /* Gradients */
  --grad-dark-chrome: linear-gradient(135deg, rgb(43, 43, 44) 0%, rgb(19, 19, 19) 100%);
  --grad-vault-horizon: linear-gradient(180deg, #000000 0%, #090a0d 45%, #101a59 100%);
}
```

### 8.2 Tailwind v4 `@theme` Configuration

```css
@theme {
  /* Surface & Canvas */
  --color-canvas: #000000;
  --color-surface-1: #15181e;
  --color-surface-2: #1f232b;
  --color-surface-3: #3b3d45;
  --color-hairline: #3b3d45;
  --color-hairline-soft: #252830;
  --color-hairline-translucent: rgba(178, 182, 189, 0.10);

  /* Inks */
  --color-ink: #ffffff;
  --color-ink-cloud: #f5f5f7;
  --color-ink-muted: #b2b6bd;
  --color-ink-subtle: #656a76;
  --color-inverse-canvas: #ffffff;
  --color-inverse-ink: #000000;

  /* HashiCorp Infrastructure Palette for Mercenta */
  --color-domain-policy: #7b42bc;
  --color-domain-policy-bright: #911ced;
  --color-domain-liquidity: #ffcf25;
  --color-domain-cleared: #00ca8e;
  --color-domain-blocked: #e62b1e;
  --color-domain-telemetry: #14c6cb;
  --color-domain-telemetry-deep: #12b6bb;
  --color-domain-rails: #1868f2;
  --color-domain-boundary: #f24c53;
  --color-accent-blue: #2b89ff;
  --color-surface-inverted: #cacaca;

  /* Fonts */
  --font-display: "Lyon Display", "DM Serif Display", serif;
  --font-sans: "Suisse Int'l", "Geist Sans", "Inter", sans-serif;
  --font-mono: "Roboto Mono", "JetBrains Mono", monospace;

  /* Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-card-large: 30px;
  --radius-pill: 9999px;

  /* Spacing */
  --spacing-section: 96px;
  --spacing-stage: 90px;
}
```

---

## 9. Explicit Design Governance: Do's and Don'ts

### Do:
- **Anchor on Pure Black**: All primary views float on `#000000`. Use `#15181e` for cards.
- **Enforce Single-Domain Accents**: A card or module dedicated to Policy must use `#7b42bc`; an Escrow module must use `#ffcf25`; an instant clearance badge must use `#00ca8e`.
- **Keep Display Headlines Whisper-Light**: Always set display headlines at 300 weight with leading ≤1.00.
- **Use 8px Radius for Action Components**: Buttons, inputs, and tabs must stay at 8px (`rounded.md`) to retain an engineered infrastructure feel.
- **Use 30px Radius for Feature Category Cards**: Category tiles have generous 30px corners (`rounded.card-large`) with 32px interior padding.
- **Precede Every Section with Monospace Eyebrows**: Uppercase tracked monospace eyebrow labels (e.g., `01 // POLICY ENGINE`) ground the section hierarchy.
- **Elevate via Color Step**: Differentiate cards by transitioning `#000000` → `#15181e` → `#1f232b`, never with blurry drop shadows.

### Don't:
- **No Purple Radial Slop**: Never apply generic neon/purple radial glows or diffuse SaaS gradients.
- **No Bold Display Titles**: Do not set headlines at 600, 700, or 800 weight.
- **No Drop Shadows on Dark Surfaces**: Shadows on `#000000` are invisible or muddy. Use hairlines and tonal surface steps.
- **No Pure White Body Text**: Reserve `#ffffff` for titles, active tags, and the primary CTA. Descriptions must use `#b2b6bd` (Ink Muted).
- **No Rainbow Component Mixing**: Never place more than one domain chromatic accent on a single card.
- **No Monospace for Long Body Text**: Monospace is reserved strictly for numbers, addresses, policy outcomes, and uppercase labels.
