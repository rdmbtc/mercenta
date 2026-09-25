import Image from "next/image";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import OrderJourney from "@/components/OrderJourney";
import PolicyTerminal from "@/components/PolicyTerminal";
import { ORDER, POLICY, percent, usdc } from "@/lib/policy";

const ECOSYSTEM = [
  { host: "app.mercenta.xyz", role: "Merchant console" },
  { host: "catalog.mercenta.xyz", role: "Supplier catalogue" },
  { host: "testnet.mercenta.xyz", role: "Testnet preview" },
  { host: "mainnet.mercenta.xyz", role: "Mainnet" },
  { host: "docs.mercenta.xyz", role: "Documentation" },
  { host: "status.mercenta.xyz", role: "Status" },
];

const SECTIONS = [
  ["Order journey", "#order-journey"],
  ["Policy engine", "#policy"],
  ["Catalogue", "#catalogue"],
  ["Settlement", "#settlement"],
  ["Status", "#status"],
];

const STEPS = [
  {
    index: "01",
    title: "Intent",
    detail: "An agent proposes a listing, a quantity and a supplier. Nothing is committed.",
  },
  {
    index: "02",
    title: "Deterministic checks",
    detail: "Balance, Reserved liquidity, margin floor, supplier status and the approval limit, in order.",
  },
  {
    index: "03",
    title: "Authorization boundary",
    detail: "Cleared, Policy blocked, or Human approval required. The rules decide, not the model.",
  },
  {
    index: "04",
    title: "Settlement and receipt",
    detail: "USDC settlement and the delivery record land on the same order.",
  },
];

const CATALOGUE = [
  {
    icon: <Layers3 />,
    name: "Cloud Compute Vouchers",
    sku: "MR-CMP-250",
    blurb: "Compute vouchers for GPU and general workloads, sourced from regional providers and issued to the buyer.",
    wholesale: "$0.71 per compute hour",
    margin: "19%",
    liquidity: "Capacity on request",
    order: ORDER.id,
  },
  {
    icon: <Globe2 />,
    name: "API Credit Bundles",
    sku: "MR-API-1000",
    blurb: "Prepaid model and API credit bought at supplier wholesale rates and delivered as redeemable codes.",
    wholesale: "$0.84 per $1.00 of credit",
    margin: "22%",
    liquidity: "Programmatic · same-day",
    order: null,
  },
  {
    icon: <Wallet />,
    name: "Enterprise SaaS Seats",
    sku: "MR-SAS-12",
    blurb: "Seat licences for business software, provisioned per contract and invoiced against the buying entity.",
    wholesale: "$0.66 per seat-month",
    margin: "24%",
    liquidity: "Allocated per contract",
    order: null,
  },
];

const COSTS = [
  ["Supplier wholesale", "Paid at the supplier\u2019s published rate, with no markup applied by Mercenta."],
  ["Platform fee", "Charged on settled order value. Illustrative rate in this preview: 1.5%."],
  ["Network fee", "Pass-through of the actual settlement network cost."],
  ["Settlement", "USDC, verifiable by transaction hash once a settlement network is live."],
];

const STATUS = [
  { label: "Live today", value: "This landing page and the browser policy demo, running on illustrative configuration.", state: "pass" },
  { label: "Not live yet", value: "No production storefront, merchant console, wallet or supplier execution is running.", state: "fail" },
  { label: "Planned next", value: "Merchant console, supplier catalogue sync and USDC settlement on Arc, then Base and Solana.", state: "hold" },
];

export default function Home() {
  return (
    <div className="shell" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <a className="brand" href="#top" aria-label="Mercenta home">
          <span className="brand-mark">
            <Image src="/mercenta-logo.png" alt="" width={40} height={40} priority />
          </span>
          mercenta<span className="brand-dot">.</span>
        </a>
        <nav className="nav" aria-label="Sections">
          {SECTIONS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <details className="eco">
          <summary>
            Ecosystem <ChevronRight size={14} />
          </summary>
          <div className="eco-panel">
            <p className="eco-note">Planned addresses for each part of the product. None of them is offered today.</p>
            {ECOSYSTEM.map((item) => (
              <a key={item.host} className="eco-link" href={"https://" + item.host}>
                <span className="eco-host">{item.host}</span>
                <span className="eco-role">{item.role}</span>
                <span className="eco-status">planned</span>
              </a>
            ))}
          </div>
        </details>
        <a className="nav-cta" href="#policy">
          Open the demo <ArrowRight size={15} />
        </a>
        <details className="mobile">
          <summary aria-label="Open navigation">
            <Menu size={18} />
          </summary>
          <nav className="mobile-panel" aria-label="Sections">
            {SECTIONS.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
                <ArrowRight size={16} />
              </a>
            ))}
            <p className="eco-note">Planned addresses, not offered today:</p>
            {ECOSYSTEM.map((item) => (
              <a key={item.host} className="eco-link" href={"https://" + item.host}>
                <span className="eco-host">{item.host}</span>
                <span className="eco-status">planned</span>
              </a>
            ))}
          </nav>
        </details>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-tags">
              <span className="chip chip--accent">Commerce OS for Autonomous Agents</span>
              <span className="chip">Pre-launch · illustrative data</span>
            </p>
            <h1 id="hero-title">
              Commerce, <span>with control.</span>
            </h1>
            <p className="hero-lead">
              A policy-controlled checkout for software agents. Agents propose what to buy; published rules decide
              whether anything is authorised; settlement and delivery are recorded on one order a finance team can read.
            </p>
            <div className="hero-actions">
              <a className="btn btn--primary" href="#policy">
                Open the interactive demo <ArrowRight size={16} />
              </a>
              <a className="btn" href="#order-journey">
                Follow one order <ChevronRight size={16} />
              </a>
            </div>
            <dl className="hero-facts">
              <div>
                <dt>Available to spend</dt>
                <dd>{usdc(POLICY.availableToSpend)}</dd>
              </div>
              <div>
                <dt>Reserved</dt>
                <dd>{usdc(POLICY.reserved)}</dd>
              </div>
              <div>
                <dt>Gross margin</dt>
                <dd>
                  floor <b>{percent(POLICY.grossMarginFloor)}</b>
                </dd>
              </div>
            </dl>
            <p className="note">Illustrative configuration, shown the same way everywhere on this page.</p>
          </div>
          <div className="hero-panel">
            <p className="kicker">How an order moves</p>
            <ol className="pipeline">
              {STEPS.map((step) => (
                <li key={step.index}>
                  <span className="pipeline-index">{step.index}</span>
                  <span className="pipeline-title">{step.title}</span>
                  <span className="pipeline-detail">{step.detail}</span>
                </li>
              ))}
            </ol>
            <p className="pipeline-foot">
              Every step writes to the same order record: what was asked, what the rules said, what was authorised and
              what settled.
            </p>
          </div>
        </section>

        <OrderJourney />

        <section className="section section--split" id="policy" aria-labelledby="policy-title">
          <div className="head head--narrow">
            <p className="kicker">Policy engine</p>
            <h2 id="policy-title">
              Rules first. <span>Then money moves.</span>
            </h2>
            <p className="head-note">
              Every intent an agent proposes runs through the same five checks in the same order. Change the inputs and
              the decision updates; the outcome never depends on a model&apos;s judgement.
            </p>
            <ul className="plain-list">
              <li>
                <LockKeyhole size={16} /> Balances, floor and approval limit are an illustrative configuration for this
                preview
              </li>
              <li>
                <Activity size={16} /> Deterministic and ordered — the same inputs always give the same decision
              </li>
              <li>
                <ShieldCheck size={16} /> A failed check blocks the order; a held check escalates to a human
              </li>
            </ul>
          </div>
          <PolicyTerminal />
        </section>

        <section className="section" id="catalogue" aria-labelledby="catalogue-title">
          <div className="head">
            <p className="kicker">The catalogue</p>
            <h2 id="catalogue-title">
              Business inputs, bought wholesale. <span>Sold at a margin you set.</span>
            </h2>
            <p className="head-note">
              Agents order from a supplier-backed catalogue — compute, credit and seats. You set the margin floor, the
              spend limit and who approves an exception.
            </p>
          </div>
          <p className="note note--inline">
            <ShieldCheck size={14} /> Illustrative demo catalogue: example listings, not actual inventory and not live
            supplier pricing.
          </p>
          <div className="cards">
            {CATALOGUE.map((item) => (
              <article className="card" key={item.name}>
                <header className="card-top">
                  <span className="card-icon">{item.icon}</span>
                  <span className="card-sku">{item.sku}</span>
                </header>
                <h3>{item.name}</h3>
                <p className="card-blurb">{item.blurb}</p>
                <dl className="card-rows">
                  <div>
                    <dt>Supplier wholesale price</dt>
                    <dd>{item.wholesale}</dd>
                  </div>
                  <div>
                    <dt>Gross margin</dt>
                    <dd>{item.margin}</dd>
                  </div>
                  <div>
                    <dt>Liquidity</dt>
                    <dd>{item.liquidity}</dd>
                  </div>
                </dl>
                <p className="card-chips">
                  <span className="chip">
                    <Check size={12} /> Supplier verified
                  </span>
                  <span className="chip chip--accent">Fulfilled after settlement</span>
                </p>
                {item.order ? (
                  <a className="card-link" href="#order-journey">
                    Follow this order, {item.order} <ChevronRight size={14} />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="settlement" aria-labelledby="settlement-title">
          <div className="head">
            <p className="kicker">Settlement</p>
            <h2 id="settlement-title">
              One record for the payment <span>and the delivery.</span>
            </h2>
            <p className="head-note">
              Settlement and delivery are written against the same order, so each charge can be matched to what it
              bought instead of trusted as a total.
            </p>
          </div>
          <div className="ledger" aria-hidden="true">
            <div className="ledger-node">
              <span className="ledger-label">Settlement</span>
              <span className="ledger-value">USDC</span>
              <span className="ledger-note">Arc · Base · Solana — planned</span>
            </div>
            <span className="ledger-link" />
            <div className="ledger-node ledger-node--core">
              <span className="ledger-label">Order record</span>
              <span className="ledger-value">{ORDER.id}</span>
              <span className="ledger-note">intent · checks · authorisation · delivery</span>
            </div>
            <span className="ledger-link" />
            <div className="ledger-node">
              <span className="ledger-label">Delivery</span>
              <span className="ledger-value tone-ok">Fulfilled</span>
              <span className="ledger-note">recorded after settlement confirms</span>
            </div>
          </div>
          <dl className="costs">
            {COSTS.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="note note--inline">
            <ShieldCheck size={14} /> Illustrative pricing model and fictional order. Rates are not final, no network is
            connected, and nothing on this page moves funds.
          </p>
        </section>

        <section className="section section--split" id="status" aria-labelledby="status-title">
          <div className="head head--narrow">
            <p className="kicker">Status</p>
            <h2 id="status-title">What is live today</h2>
            <p className="head-note">
              Mercenta is pre-launch. We would rather describe the gap than imply a product that does not run yet.
            </p>
          </div>
          <dl className="status">
            {STATUS.map((row) => (
              <div key={row.label} className={"status-row status-" + row.state}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="cta">
          <p className="kicker">Early access</p>
          <h2>
            Put a boundary in front of <span>the next purchase.</span>
          </h2>
          <p>Pre-launch. No signup form is wired into this preview.</p>
          <div className="hero-actions">
            <a className="btn btn--primary" href="#policy">
              Open the interactive demo <ArrowRight size={16} />
            </a>
            <a className="btn" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
              Follow the build on X <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            mercenta<span className="brand-dot">.</span>
          </a>
          <p>Propose. Check. Authorise. Settle.</p>
        </div>
        <nav className="footer-eco" aria-label="Ecosystem">
          <p className="kicker">Ecosystem — planned, not live</p>
          {ECOSYSTEM.map((item) => (
            <a key={item.host} href={"https://" + item.host}>
              {item.host}
              <span className="eco-status">planned</span>
            </a>
          ))}
        </nav>
        <div className="footer-meta">
          <a href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
            X / Twitter <ArrowUpRight size={13} />
          </a>
          <a href="#status">Status</a>
          <a href="#order-journey">Order journey</a>
          <span>© {new Date().getFullYear()} Mercenta</span>
        </div>
      </footer>
      <p className="attribution">
        Arc is a trademark of Circle Internet Group, Inc. and/or its affiliates. Mercenta is independently developed; no
        Circle partnership or endorsement is implied. Network coverage described on this page is planned, not live.
      </p>
    </div>
  );
}
