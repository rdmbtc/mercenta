# Mercenta (`MERC`)

Latest landing-page verification: production build and ESLint passed; desktop and 390px mobile preview checked with no horizontal overflow, mobile navigation works, and the OpenClaw simulation responds to pointer input. The film uses a 350vh native-scroll stage and reaches the end of the existing clip. Chromium reduced-motion emulation confirmed that the video is absent and all four acts render as static sections.

> **The Commerce OS for Autonomous AI Agents.**  
> Policy-governed procurement, verifiable supplier rails, and deterministic USDC settlement.  
> *Not magic. Just math & margins.*

---

> **Status: pre-launch.** Everything in this repository is an illustrative simulation. No network is
> connected, no card is issued, no order is placed and no funds move. Prices, suppliers, orders and
> addresses shown in the web preview are fictional.

## Overview

**Mercenta** is an infrastructure layer and autonomous commerce platform enabling AI agents and merchants to trade digital goods, compute vouchers, and API licenses safely. 

Unlike unbounded autonomous agents, Mercenta enforces strict deterministic guardrails:
- **Spend & Margin Floor Protection**: Automatically cancels or requests human approval if gross margin drops or purchase price exceeds limits.
- **Settlement**: USDC settlement, planned for the Arc™ Network first, then Base and Solana. Not live: no
  network is connected and no funds move anywhere in this repository today.
- **Supplier Integration Rails**: Catalog synchronization described here runs through the Wholesale Provider API/SDK.
  The supplier, listing and prices in the preview are fictional.

---

## Platform Subdomains Ecosystem

| Subdomain | Purpose |
| :--- | :--- |
| **`mercenta.xyz`** | Official landing page and protocol overview. |
| **`testnet.mercenta.xyz`** | Sandbox environment for agent testing and simulated orders. |
| **`app.mercenta.xyz`** | Production merchant portal and autonomous agent dashboard. |
| **`docs.mercenta.xyz`** | Protocol documentation, SDK references, and API specs. |
| **`catalog.mercenta.xyz`** | B2B catalogue of digital goods, software licenses, and compute (planned). |
| **`status.mercenta.xyz`** | Health status of payment gateways, suppliers, and nodes (planned). |

---

## Key Terminology & Policy Controls

Mercenta rejects vague promises and operates strictly on deterministic state machines:

- **Available to spend**: Unallocated agent budget for the current operational window.
- **Reserved**: Budget committed to settlements that have not settled yet.
- **Gross margin**: Margin verified against the merchant's policy floor on every transaction.
- **Agent decision**: The procurement decision an agent proposes. The policy engine, not the agent, decides.
- **Policy blocked**: Automated halting of transactions that violate margin, budget, or liquidity rules.
- **Human approval required**: Automated escalation to merchant operators when conditions require human intervention.
- **Fulfilled**: A delivery recorded against the order after settlement confirms.
- **Supplier uncertain**: Status trigger when supplier availability or pricing cannot be confirmed.

---

## Project Structure

```
.
├── assets/                 # Brand assets, logos, and badges
├── sdk/
│   └── Wholesale Provider-sdk/       # Multi-language Wholesale Provider SDK (Python, TS, Go, PHP)
├── web/                    # Next.js 15, React 19, Tailwind CSS Web Application
├── main.py                 # Higgsfield Seedance 2.5 video generation pipeline
├── IMPLEMENTATION_PLAN.md  # Detailed architecture and engineering plan
└── README.md
```

---

## Local liquidity workspace

The independent `backend/` service is connected through authenticated Next.js BFF routes. The current local preview uses web port **3011** and backend port **3013** (3012 is reserved for documentation).

- `/`: technology bento and direct navigation.
- `/app`: Liquidity with Earn, cirBTC Borrow and Fiat Onramp tabs.
- `/catalog`: shopping advisor and product batch selection.
- `/status`: capability and service status.

Earn, Borrow and card/Apple Pay are clearly labelled sandbox models, not live investment or payment services. LLM access requires server-only provider configuration; otherwise the advisor is labelled rule-based. Ten free consultations are enforced server-side. Real fulfillment and Mainnet payments are disabled by default. See `backend/README.md` for deployment prerequisites and remaining production release gates.

Run `npm test` and `npm run build` separately in `backend/` and `web/`. Publication audits exclude private environment files, private backups and historical Git objects; existing Git history must be reviewed before public release.

## Web Application Quickstart

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Social & Community

- **X (Twitter)**: [@mercentaxyz](https://x.com/mercentaxyz)
- **Website**: [mercenta.xyz](https://mercenta.xyz)

---

## Disclaimer

*Arc is a trademark of Circle Internet Group, Inc. and/or its affiliates. Mercenta is independently developed; no Circle partnership or endorsement is implied.*
