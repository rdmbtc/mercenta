import Image from "next/image";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Blocks,
  Check,
  ChevronRight,
  Coins,
  FileCheck2,
  Fingerprint,
  Gauge,
  Globe2,
  Layers3,
  ListChecks,
  LockKeyhole,
  Route,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  Workflow,
} from "lucide-react";
import DecisionFeed from "@/components/DecisionFeed";
import OrderJourney from "@/components/OrderJourney";
import PolicyTerminal from "@/components/PolicyTerminal";
import ScrollEffects from "@/components/ScrollEffects";
import SiteHeader from "@/components/SiteHeader";
import SpotlightGrid from "@/components/SpotlightGrid";
import { CASES, ORDER, POLICY, evaluatePolicy, percent, usdc } from "@/lib/policy";

const ECOSYSTEM = [
  { host: "app.mercenta.xyz", role: "Merchant console" },
  { host: "catalog.mercenta.xyz", role: "Supplier catalogue" },
  { host: "testnet.mercenta.xyz", role: "Testnet preview" },
  { host: "mainnet.mercenta.xyz", role: "Mainnet" },
  { host: "docs.mercenta.xyz", role: "Documentation" },
  { host: "status.mercenta.xyz", role: "Status" },
];

const SECTIONS = [
  { label: "Order journey", href: "#order-journey", id: "order-journey" },
  { label: "Policy engine", href: "#policy", id: "policy" },
  { label: "Platform", href: "#platform", id: "platform" },
  { label: "Catalogue", href: "#catalogue", id: "catalogue" },
  { label: "Settlement", href: "#settlement", id: "settlement" },
  { label: "Status", href: "#status", id: "status" },
];

const VOCABULARY = [
  "Available to spend",
  "Reserved",
  "Gross margin",
  "Agent decision",
  "Policy blocked",
  "Human approval required",
  "Fulfilled",
  "Supplier uncertain",
];

const STEPS = [
  {
    index: "01",
    title: "Intent",
    detail: "An agent proposes a listing, a quantity and a supplier. Nothing is committed and no balance is touched.",
    icon: <Route />,
  },
  {
    index: "02",
    title: "Deterministic checks",
    detail:
      "Available to spend, Reserved liquidity, the Gross margin floor, supplier status and the approval limit — in that order.",
    icon: <ListChecks />,
  },
  {
    index: "03",
    title: "Authorization boundary",
    detail: "Cleared, Policy blocked, or Human approval required. The rules decide; the model never holds the pen.",
    icon: <Scale />,
  },
  {
    index: "04",
    title: "Settlement and receipt",
    detail: "USDC settlement and the delivery record land on the same order a finance team can read.",
    icon: <FileCheck2 />,
  },
];

const CATALOGUE = [
  {
    icon: <Layers3 />,
    name: "Cloud Compute Vouchers",
    sku: ORDER.sku,
    blurb: "Compute vouchers for GPU and general workloads, sourced from regional providers and issued to the buyer.",
    wholesale: "$" + ORDER.wholesaleRate.toFixed(2) + " / compute hour",
    margin: "19%",
    liquidity: "Capacity on request",
    order: ORDER.id,
  },
  {
    icon: <Globe2 />,
    name: "API Credit Bundles",
    sku: "MR-API-1000",
    blurb: "Prepaid model and API credit bought at supplier wholesale rates and delivered as redeemable codes.",
    wholesale: "$0.84 / $1.00 credit",
    margin: "16%",
    liquidity: "Programmatic · same-day",
    order: null,
  },
  {
    icon: <Wallet />,
    name: "Enterprise SaaS Seats",
    sku: "MR-SAS-12",
    blurb: "Seat licences for business software, provisioned per contract and invoiced against the buying entity.",
    wholesale: "$63.00 / seat-month",
    margin: "19%",
    liquidity: "Allocated per contract",
    order: null,
  },
];

const COSTS = [
  ["Supplier wholesale", "Paid at the supplier\u2019s published rate, with no markup applied by Mercenta."],
  [
    "Platform fee",
    "Charged on settled order value. Illustrative rate in this preview: " + percent(POLICY.platformFee) + ".",
  ],
  ["Network fee", "Pass-through of the actual settlement network cost."],
  ["Settlement", "USDC, verifiable by transaction hash once a settlement network is live."],
];

const STATUS = [
  {
    label: "Live today",
    value: "This landing page and the browser policy demo, running on illustrative configuration.",
    state: "ok",
  },
  {
    label: "Not live yet",
    value: "No production storefront, merchant console, wallet or supplier execution is running.",
    state: "stop",
  },
  {
    label: "Planned next",
    value: "Merchant console, supplier catalogue sync and USDC settlement on Arc, then Base and Solana.",
    state: "hold",
  },
];

const METRICS = [
  { value: 5, label: "ordered checks", detail: "Same inputs, same decision. Every time." },
  { value: 3, label: "possible outcomes", detail: "Cleared · Policy blocked · Human approval required." },
  { value: 1, label: "order record", detail: "Intent, decision, settlement and delivery, together." },
  { value: 0, label: "model authority", detail: "A model proposes. It never authorises." },
];

type Token = [kind: "" | "kw" | "fn" | "str" | "cm" | "nl", text: string];

const SDK_SNIPPET: Token[] = [
  ["kw", "const"],
  ["", " decision = "],
  ["fn", "evaluatePolicy"],
  ["", "(intent);"],
  ["nl", ""],
  ["kw", "if"],
  ["", " (decision !== "],
  ["str", '"Cleared"'],
  ["", ") {"],
  ["nl", ""],
  ["", "  "],
  ["kw", "return"],
  ["", " hold(decision);"],
  ["nl", ""],
  ["", "}"],
  ["nl", ""],
  ["nl", ""],
  ["cm", "// supplier rail, only after the gate"],
  ["nl", ""],
  ["kw", "await"],
  ["", " client.orders."],
  ["fn", "create"],
  ["", "({ ...intent });"],
  ["nl", ""],
  ["kw", "await"],
  ["", " ledger."],
  ["fn", "settle"],
  ["", "(order.id, "],
  ["str", '"USDC"'],
  ["", ");"],
];

const ORDER_STATES = ["Created", "Policy check", "Approved", "Purchasing", "Fulfilled"];

const METER_SCALE = 0.4;

function meterWidth(margin: number) {
  return (Math.max(0, Math.min(1, margin / METER_SCALE)) * 100).toFixed(1) + "%";
}

const FLOOR_LEFT = ((POLICY.grossMarginFloor / METER_SCALE) * 100).toFixed(1) + "%";

export default function Home() {
  const cleared = evaluatePolicy(CASES.order.amount, CASES.order.cost, CASES.order.supplier);
  const thin = evaluatePolicy(CASES.thin.amount, CASES.thin.cost, CASES.thin.supplier);
  const held = evaluatePolicy(CASES.overLimit.amount, CASES.overLimit.cost, CASES.overLimit.supplier);
  const fee = CASES.order.amount * POLICY.platformFee;

  return (
    <div className="shell" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollEffects />
      <SiteHeader sections={SECTIONS} ecosystem={ECOSYSTEM} />

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true">
            <span className="aurora aurora--a" />
            <span className="aurora aurora--b" />
            <span className="aurora aurora--c" />
            <span className="hero-grid" />
            <span className="hero-beam" />
            <span className="hero-ring" />
          </div>

          <div className="hero-inner">
            <div className="hero-copy">
              <p className="hero-tags">
                <span className="chip chip--accent">
                  <Sparkles size={12} aria-hidden="true" /> Commerce OS for autonomous agents
                </span>
                <span className="chip">Pre-launch · illustrative data</span>
              </p>
              <h1 id="hero-title">
                Commerce, <span className="grad">with control.</span>
              </h1>
              <p className="hero-lead">
                A policy-controlled checkout for software agents. Agents propose what to buy; published rules decide
                whether anything is authorised; settlement and delivery are recorded on one order a finance team can
                read.
              </p>
              <div className="hero-actions">
                <a className="btn btn--primary btn--lg" href="#policy">
                  Open the interactive demo <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a className="btn btn--lg" href="#order-journey">
                  Follow one order <ChevronRight size={16} aria-hidden="true" />
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
                  <dt>Gross margin floor</dt>
                  <dd>{percent(POLICY.grossMarginFloor)}</dd>
                </div>
                <div>
                  <dt>Auto-approval limit</dt>
                  <dd>{usdc(POLICY.autoApprovalLimit)}</dd>
                </div>
              </dl>
              <p className="note">Illustrative configuration, shown the same way everywhere on this page.</p>
            </div>

            <div className="hero-visual">
              <DecisionFeed />
            </div>
          </div>

          <a className="hero-scroll" href="#how">
            <span className="hero-scroll-line" aria-hidden="true" />
            Scroll
          </a>
        </section>

        <div className="ticker" aria-label="Vocabulary used across the platform">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                {VOCABULARY.map((term) => (
                  <li key={term}>
                    <span className="ticker-dot" aria-hidden="true" />
                    {term}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <section className="section" id="how" aria-labelledby="how-title">
          <div className="head head--center" data-reveal>
            <p className="kicker">How an order moves</p>
            <h2 id="how-title">
              Propose. Check. <span className="grad">Authorise. Settle.</span>
            </h2>
            <p className="head-note">
              Four steps, one order record. Every step writes down what was asked, what the rules said, what was
              authorised and what settled.
            </p>
          </div>
          <ol className="pipeline" data-reveal>
            <span className="pipeline-rail" aria-hidden="true">
              <span className="pipeline-packet" />
            </span>
            {STEPS.map((step, index) => (
              <li key={step.index} className="pipeline-step" style={{ "--i": index } as CSSProperties}>
                <span className="pipeline-node" aria-hidden="true">
                  {step.icon}
                </span>
                <span className="pipeline-index">{step.index}</span>
                <h3 className="pipeline-title">{step.title}</h3>
                <p className="pipeline-detail">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <OrderJourney />

        <section className="section" id="policy" aria-labelledby="policy-title">
          <div className="policy-head" data-reveal>
            <div className="head head--narrow">
              <p className="kicker">Policy engine</p>
              <h2 id="policy-title">
                Rules first. <span className="grad">Then money moves.</span>
              </h2>
              <p className="head-note">
                Every intent an agent proposes runs through the same five checks in the same order. Change the inputs
                and the decision updates; the outcome never depends on a model&apos;s judgement.
              </p>
            </div>
            <ul className="plain-list">
              <li>
                <span className="plain-icon">
                  <LockKeyhole size={15} aria-hidden="true" />
                </span>
                Balances, floor and approval limit are an illustrative configuration for this preview
              </li>
              <li>
                <span className="plain-icon">
                  <Activity size={15} aria-hidden="true" />
                </span>
                Deterministic and ordered — the same inputs always give the same decision
              </li>
              <li>
                <span className="plain-icon">
                  <ShieldCheck size={15} aria-hidden="true" />
                </span>
                A failed check blocks the order; a held check escalates to a human
              </li>
            </ul>
          </div>
          <div data-reveal>
            <PolicyTerminal />
          </div>
        </section>

        <section className="section" id="platform" aria-labelledby="platform-title">
          <div className="head head--center" data-reveal>
            <p className="kicker">Platform</p>
            <h2 id="platform-title">
              Built for finance teams, <span className="grad">not for demos.</span>
            </h2>
            <p className="head-note">
              Everything an autonomous buyer needs to be trusted with a budget: hard limits, a human in the loop where
              it matters, and a record that reconciles itself.
            </p>
          </div>

          <SpotlightGrid className="bento">
            <article className="bento-card spot bento-card--wide" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <ListChecks size={18} aria-hidden="true" />
                </span>
                <h3>Deterministic policy engine</h3>
              </div>
              <p>
                Five ordered checks, no model in the decision path. The order on this page clears every one of them,
                and the same code decides in the terminal above.
              </p>
              <ul className="mini-checks" aria-label="Checks for this page's order">
                {cleared.checks.map((check) => (
                  <li key={check.id} className={"check-" + check.state}>
                    <span className="check-mark" aria-hidden="true">
                      {check.state === "pass" ? "✓" : check.state === "hold" ? "!" : "×"}
                    </span>
                    <span>{check.label}</span>
                    <em>{check.note}</em>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bento-card spot" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <Gauge size={18} aria-hidden="true" />
                </span>
                <h3>Spend and margin floors</h3>
              </div>
              <p>
                Available to spend, Reserved liquidity and a Gross margin floor you publish. A thin order is blocked
                before a supplier is ever contacted.
              </p>
              <div className="floor-viz" aria-hidden="true">
                <div className="floor-row">
                  <span>{CASES.order.label}</span>
                  <span className="margin-meter tone-ok">
                    <span style={{ width: meterWidth(cleared.margin) }} />
                    <span className="margin-floor" style={{ left: FLOOR_LEFT }} />
                  </span>
                  <b className="tone-ok">{percent(cleared.margin)}</b>
                </div>
                <div className="floor-row">
                  <span>{CASES.thin.label}</span>
                  <span className="margin-meter tone-stop">
                    <span style={{ width: meterWidth(thin.margin) }} />
                    <span className="margin-floor" style={{ left: FLOOR_LEFT }} />
                  </span>
                  <b className="tone-stop">{percent(thin.margin)}</b>
                </div>
              </div>
            </article>

            <article className="bento-card spot" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <UserCheck size={18} aria-hidden="true" />
                </span>
                <h3>Human approval queue</h3>
              </div>
              <p>
                Above the auto-approval limit, execution pauses and the intent waits for a person. Nothing is bought
                automatically while it waits.
              </p>
              <div className="queue-viz" aria-hidden="true">
                <span className="queue-item tone-hold">
                  <span className="queue-id">MR-ORD-2484</span>
                  <span>{usdc(CASES.overLimit.amount)}</span>
                  <span className="queue-state">{held.decision}</span>
                </span>
                <span className="queue-pulse" />
              </div>
            </article>

            <article className="bento-card spot" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <Blocks size={18} aria-hidden="true" />
                </span>
                <h3>Supplier rails</h3>
              </div>
              <p>
                Catalogue, stock and purchase calls run through the AppRoute SDK — TypeScript, Python, Go and PHP —
                only after the policy gate has cleared the intent.
              </p>
              <pre className="code" aria-label="Illustrative integration snippet">
                <code>
                  {SDK_SNIPPET.map(([kind, text], index) =>
                    kind === "nl" ? (
                      "\n"
                    ) : (
                      <span key={index} className={kind ? "tok-" + kind : undefined}>
                        {text}
                      </span>
                    ),
                  )}
                </code>
              </pre>
            </article>

            <article className="bento-card spot" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <Coins size={18} aria-hidden="true" />
                </span>
                <h3>USDC settlement</h3>
              </div>
              <p>
                Deterministic settlement in USDC, verifiable by transaction hash. Arc first, then Base and Solana —
                all planned, none live today.
              </p>
              <ul className="chain-list">
                {["Arc", "Base", "Solana"].map((chain) => (
                  <li key={chain}>
                    <span className="chain-dot" aria-hidden="true" /> {chain}
                    <span className="eco-status">planned</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bento-card spot bento-card--wide" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <Fingerprint size={18} aria-hidden="true" />
                </span>
                <h3>One append-only record</h3>
              </div>
              <p>
                Intent, checks, decision, settlement and delivery are written against the same order, so each charge
                matches what it bought.
              </p>
              <ol className="audit" aria-hidden="true">
                <li>
                  <span>intent.proposed</span>
                  <em>{ORDER.id}</em>
                </li>
                <li>
                  <span>policy.evaluated</span>
                  <em className="tone-ok">Cleared · 5/5</em>
                </li>
                <li>
                  <span>settlement.confirmed</span>
                  <em>{usdc(CASES.order.amount)}</em>
                </li>
                <li>
                  <span>delivery.recorded</span>
                  <em className="tone-ok">Fulfilled</em>
                </li>
              </ol>
            </article>

            <article className="bento-card spot" data-reveal>
              <div className="bento-head">
                <span className="bento-icon">
                  <Workflow size={18} aria-hidden="true" />
                </span>
                <h3>Strict state machine</h3>
              </div>
              <p>
                Orders move only through valid transitions. A supplier timeout reconciles instead of blindly retrying,
                and a duplicate payment can never create a second order.
              </p>
              <ol className="states" aria-hidden="true">
                {ORDER_STATES.map((state, index) => (
                  <li key={state} className={index === ORDER_STATES.length - 1 ? "is-final" : undefined}>
                    {state}
                  </li>
                ))}
              </ol>
            </article>
          </SpotlightGrid>
        </section>

        <section className="metrics" aria-label="Structural facts about the policy engine">
          <div className="metrics-inner">
            {METRICS.map((metric) => (
              <div key={metric.label} className="metric" data-reveal>
                <p className="metric-value">
                  <span data-count={metric.value}>{metric.value}</span>
                </p>
                <p className="metric-label">{metric.label}</p>
                <p className="metric-detail">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="catalogue" aria-labelledby="catalogue-title">
          <div className="head" data-reveal>
            <p className="kicker">The catalogue</p>
            <h2 id="catalogue-title">
              Business inputs, bought wholesale. <span className="grad">Sold at a margin you set.</span>
            </h2>
            <p className="head-note">
              Agents order from a supplier-backed catalogue — compute, credit and seats. You set the margin floor, the
              spend limit and who approves an exception.
            </p>
          </div>
          <p className="note note--inline" data-reveal>
            <ShieldCheck size={14} aria-hidden="true" /> Illustrative demo catalogue: example listings, not actual
            inventory and not live supplier pricing.
          </p>
          <div className="cards">
            {CATALOGUE.map((item, index) => (
              <article className="card" key={item.name} data-reveal style={{ "--i": index } as CSSProperties}>
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
                    <Check size={12} aria-hidden="true" /> Supplier verified
                  </span>
                  <span className="chip chip--accent">Fulfilled after settlement</span>
                </p>
                {item.order ? (
                  <a className="card-link" href="#order-journey">
                    Follow this order, {item.order} <ChevronRight size={14} aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="settlement" aria-labelledby="settlement-title">
          <div className="head" data-reveal>
            <p className="kicker">Settlement</p>
            <h2 id="settlement-title">
              One record for the payment <span className="grad">and the delivery.</span>
            </h2>
            <p className="head-note">
              Settlement and delivery are written against the same order, so each charge can be matched to what it
              bought instead of trusted as a total.
            </p>
          </div>
          <div className="ledger" data-reveal aria-hidden="true">
            <div className="ledger-cell">
              <span className="ledger-label">Order</span>
              <span className="ledger-value">{ORDER.id}</span>
              <span className="ledger-note">
                {ORDER.units} {ORDER.unit} · {ORDER.supplier}
              </span>
            </div>
            <span className="ledger-link" />
            <div className="ledger-cell">
              <span className="ledger-label">Supplier purchase</span>
              <span className="ledger-value">{usdc(CASES.order.cost)}</span>
              <span className="ledger-note">paid at the supplier&apos;s wholesale rate</span>
            </div>
            <span className="ledger-link" />
            <div className="ledger-cell">
              <span className="ledger-label">Settlement</span>
              <span className="ledger-value">{usdc(CASES.order.amount)}</span>
              <span className="ledger-note">USDC · platform fee {usdc(fee)} · network planned</span>
            </div>
            <span className="ledger-link" />
            <div className="ledger-cell">
              <span className="ledger-label">Delivery</span>
              <span className="ledger-value tone-ok">Fulfilled</span>
              <span className="ledger-note">recorded after settlement confirms</span>
            </div>
          </div>
          <dl className="costs" data-reveal>
            {COSTS.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="note note--inline" data-reveal>
            <ShieldCheck size={14} aria-hidden="true" /> Illustrative pricing model and fictional order. Rates are not
            final, no network is connected, and nothing on this page moves funds.
          </p>
        </section>

        <section className="section section--tight" id="status" aria-labelledby="status-title">
          <div className="head head--center" data-reveal>
            <p className="kicker">Status</p>
            <h2 id="status-title">What is live today</h2>
            <p className="head-note">
              Mercenta is pre-launch. We would rather describe the gap than imply a product that does not run yet.
            </p>
          </div>
          <dl className="status" data-reveal>
            {STATUS.map((row) => (
              <div key={row.label} className={"status-row tone-" + row.state}>
                <dt>
                  <span className="status-dot" aria-hidden="true" />
                  {row.label}
                </dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="cta-wrap">
          <div className="cta" data-reveal>
            <span className="cta-glow" aria-hidden="true" />
            <Image className="cta-mark" src="/mercenta-logo.png" alt="" width={420} height={420} aria-hidden="true" />
            <p className="kicker">Early access</p>
            <h2>
              Put a boundary in front of <span className="grad">the next purchase.</span>
            </h2>
            <p className="cta-lead">
              Pre-launch. No signup form is wired into this preview — follow the build, or step through the demo above.
            </p>
            <div className="hero-actions">
              <a className="btn btn--primary btn--lg" href="#policy">
                Open the interactive demo <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a className="btn btn--lg" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
                Follow the build on X <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="cta-badges">
              <span className="chip">
                <BadgeCheck size={12} aria-hidden="true" /> Deterministic policy
              </span>
              <span className="chip">
                <Coins size={12} aria-hidden="true" /> USDC settlement · planned
              </span>
              <span className="chip">
                <Fingerprint size={12} aria-hidden="true" /> One order record
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <span className="brand-mark">
                <Image src="/mercenta-logo.png" alt="" width={36} height={36} />
              </span>
              <span className="brand-word">
                mercenta<span className="brand-dot">.</span>
              </span>
            </a>
            <p className="footer-line">Propose. Check. Authorise. Settle.</p>
            <p className="footer-tag">The Commerce OS for autonomous AI agents. Not magic — math and margins.</p>
          </div>
          <nav className="footer-col" aria-label="Sections">
            <p className="kicker">Explore</p>
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href}>
                {section.label}
              </a>
            ))}
          </nav>
          <nav className="footer-col" aria-label="Ecosystem">
            <p className="kicker">Ecosystem · planned, not live</p>
            {ECOSYSTEM.map((item) => (
              <a key={item.host} href={"https://" + item.host}>
                {item.host}
                <span className="eco-status">planned</span>
              </a>
            ))}
          </nav>
          <div className="footer-col">
            <p className="kicker">Follow</p>
            <a href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
              X / Twitter · @mercentaxyz <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a href="https://mercenta.xyz">mercenta.xyz</a>
          </div>
        </div>
        <div className="footer-meta">
          <span>© {new Date().getFullYear()} Mercenta</span>
          <span>Pre-launch preview · illustrative data · no live funds</span>
        </div>
        <p className="footer-word" aria-hidden="true">
          mercenta
        </p>
      </footer>
      <p className="attribution">
        Arc is a trademark of Circle Internet Group, Inc. and/or its affiliates. Mercenta is independently developed; no
        Circle partnership or endorsement is implied. Network coverage described on this page is planned, not live.
      </p>
    </div>
  );
}
