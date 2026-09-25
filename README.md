# Mercenta (`MERC`)

> **The Commerce OS for Autonomous AI Agents.**  
> Policy-governed procurement, verifiable supplier rails, and deterministic USDC settlement.  
> *Not magic. Just math & margins.*

---

## Overview

**Mercenta** is an infrastructure layer and autonomous commerce platform enabling AI agents and merchants to trade digital goods, compute vouchers, and API licenses safely. 

Unlike unbounded autonomous agents, Mercenta enforces strict deterministic guardrails:
- **Spend & Margin Floor Protection**: Automatically cancels or requests human approval if gross margin drops or purchase price exceeds limits.
- **Verifiable Settlement**: Native USDC settlement on the Arc™ Network, Base, and Solana.
- **Supplier Integration Rails**: Connected catalog synchronization via the AppRoute API/SDK.

---

## Platform Subdomains Ecosystem

| Subdomain | Purpose |
| :--- | :--- |
| **`mercenta.xyz`** | Official landing page and protocol overview. |
| **`testnet.mercenta.xyz`** | Sandbox environment for agent testing and simulated orders. |
| **`app.mercenta.xyz`** | Production merchant portal and autonomous agent dashboard. |
| **`docs.mercenta.xyz`** | Protocol documentation, SDK references, and API specs. |
| **`catalog.mercenta.xyz`** | Live B2B catalogue of digital goods, software licenses, and compute. |
| **`status.mercenta.xyz`** | Real-time health status of payment gateways, suppliers, and nodes. |

---

## Key Terminology & Policy Controls

Mercenta rejects vague promises and operates strictly on deterministic state machines:

- **Available to spend**: Verified, unallocated agent budget for the current operational window.
- **Reserved**: Escrowed funds allocated for pending supplier settlements.
- **Gross margin**: Real-time margin verification on every transaction against merchant policy floors.
- **Agent decision**: Cryptographically signed procurement decisions made by authorized agent nodes.
- **Policy blocked**: Automated halting of transactions that violate margin, budget, or liquidity rules.
- **Human approval required**: Automated escalation to merchant operators when conditions require human intervention.
- **Fulfilled**: Cryptographically verified order delivery and license transfer.
- **Supplier uncertain**: Status trigger when supplier availability or pricing cannot be guaranteed with high confidence.

---

## Project Structure

```
.
├── assets/                 # Brand assets, logos, and badges
├── sdk/
│   └── approute-sdk/       # Multi-language AppRoute SDK (Python, TS, Go, PHP)
├── web/                    # Next.js 15, React 19, Tailwind CSS Web Application
├── main.py                 # Higgsfield Seedance 2.5 video generation pipeline
├── IMPLEMENTATION_PLAN.md  # Detailed architecture and engineering plan
└── README.md
```

---

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
