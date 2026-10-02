"use client";

import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import ScrollStory from "./ScrollStory";
import { MorphHeadline, SupplySection, BusinessPlaybooks, BuildSection, LandingFAQ } from "./LandingExperience";
import { CASES, ORDER, POLICY, evaluatePolicy, percent, usdc, type SupplierState } from "@/lib/policy";
import {LiquidityBento} from './LiquidityBento';

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function StatusIcon({ state }: { state: string }) {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" /><path d={state === "pass" ? "m6 10 2.5 2.5L14 7" : state === "hold" ? "M10 5v5l3 2" : "m7 7 6 6m0-6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const CHECK_LABELS = ["Spend balance", "Reserved funds", "Gross margin floor", "Supplier verification", "Approval threshold"];
const SCENARIOS = [
  { key: "order", label: "Valid order", short: "Cleared" },
  { key: "thin", label: "Thin margin", short: "Blocked" },
  { key: "uncertain", label: "Unknown supplier", short: "Blocked" },
  { key: "overLimit", label: "Over limit", short: "Review" },
] as const;
const GOODS = [
  { name: "Compute", tag: "Infrastructure", code: "CMP", title: "Power the next workload.", description: "Cloud compute and GPU vouchers for agent workloads. Capacity becomes a structured order, not a manual checkout.", detail: "Cloud compute · GPU vouchers", symbol: "⌘" },
  { name: "API credits", tag: "Developer tools", code: "API", title: "Keep your agents thinking.", description: "Prepaid API credits and token bundles. Give software a way to acquire the resources it needs, within your policy.", detail: "API credits · Token bundles", symbol: "</>" },
  { name: "Digital goods", tag: "Digital commerce", code: "KEY", title: "Digital delivery. Clear rules.", description: "Gaming keys, platform vouchers and streaming subscriptions, with supplier and margin checks before authorization.", detail: "Gaming keys · Streaming plans", symbol: "↗" },
  { name: "Creator tips", tag: "Micro-transactions", code: "TIP", title: "Small payments. Full context.", description: "Illustrative creator micro-donations with the same transparent approval path. Every amount stays accountable.", detail: "Creator support · Micro-donations", symbol: "+" },
];

export default function FlagshipLanding() {
  const [menu, setMenu] = useState(false);
  const [motion, setMotion] = useState(true);
  const [activeCase, setActiveCase] = useState<string>("order");
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>("verified");
  const [good, setGood] = useState(0);
  const [copied, setCopied] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const receiptButton = useRef<HTMLButtonElement>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const closeReceipt = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const result = evaluatePolicy(amount, cost, supplier);
  const example = evaluatePolicy(CASES.order.amount, CASES.order.cost, CASES.order.supplier);
  const tone = result.decision === "Cleared" ? "pass" : result.decision === "Policy blocked" ? "fail" : "hold";
  const currentGood = GOODS[good];

  useEffect(() => {
    document.body.classList.add("mercenta-flagship");
    return () => document.body.classList.remove("mercenta-flagship");
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, easing: "cubic-bezier(.22,1,.36,1)" });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    document.querySelectorAll(".mx-control-intro, .mx-section-heading, .mx-playground-copy, .mx-catalog h2, .mx-evidence-layout > div:first-child, .mx-final h2, .mx-expansion-copy, .mx-expansion-heading, .mx-ownership-strip article, .mx-playbook-grid article, .mx-faq h2").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const container = document.querySelector<HTMLElement>(".mx");
    const hero = document.querySelector<HTMLElement>(".mx-hero");
    let frame = 0;
    function update() {
      frame = 0;
      if (!container || !hero) return;
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      container.style.setProperty("--mx-reading-progress", String(Math.max(0, Math.min(1, window.scrollY / distance))));
      container.style.setProperty("--mx-hero-scroll", reduce.matches ? "0" : String(Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight))));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reduce.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
    };
  }, []);
  useEffect(() => {
    if (!menu) return;
    document.querySelector<HTMLAnchorElement>("#mx-mobile-nav a")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); menuButton.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  useEffect(() => {
    if (receiptOpen) { dialog.current?.showModal(); closeReceipt.current?.focus(); }
    else if (dialog.current?.open) dialog.current.close();
  }, [receiptOpen]);
  function chooseCase(key: keyof typeof CASES) {
    const item = CASES[key]; setActiveCase(key); setAmount(item.amount); setCost(item.cost); setSupplier(item.supplier);
  }
  function dismissReceipt() { setReceiptOpen(false); receiptButton.current?.focus(); }
  async function copyReceipt() {
    const text = JSON.stringify({ illustrative: true, order: ORDER.id, listing: ORDER.listing, supplier: ORDER.supplier, clientPrice: CASES.order.amount, supplierCost: CASES.order.cost, platformFee: CASES.order.amount * POLICY.platformFee, grossMargin: example.margin, decision: example.decision, policy: POLICY.version }, null, 2);
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  }

  return <div className="mx" data-motion={motion ? "running" : "paused"}>
    <a className="mx-skip" href="#main">Skip to content</a>
    <header className="mx-nav">
      <div className="mx-wrap mx-nav-inner">
        <a href="#" className="mx-brand" aria-label="Mercenta home"><BrandMark /><span>mercenta<span className="mx-brand-dot">.</span></span></a>
        <nav className="mx-desktop-links" aria-label="Main navigation"><a href="#business">For your business</a><a href="#architecture">How it works</a><a href="#playground">Playground</a><a href="/catalog">Catalog</a><a href="/status">Status</a></nav>
        <a className="mx-nav-console" href="/app">Console & Liquidity <Arrow diagonal /></a>
        <button ref={menuButton} type="button" className="mx-menu-toggle" aria-expanded={menu} aria-controls="mx-mobile-nav" aria-label={menu ? "Close navigation" : "Open navigation"} onClick={() => setMenu(!menu)}><span /><span /></button>
      </div>
      {menu && <nav className="mx-mobile-links" id="mx-mobile-nav" aria-label="Mobile navigation"><a href="#business" onClick={() => setMenu(false)}>For your business <Arrow /></a><a href="#architecture" onClick={() => setMenu(false)}>How it works <Arrow /></a><a href="#playground" onClick={() => setMenu(false)}>Playground <Arrow /></a><a href="#catalog" onClick={() => setMenu(false)}>Catalog <Arrow /></a><a href="/status">Status <Arrow diagonal /></a><a href="/app">Console & Liquidity <Arrow diagonal /></a></nav>}
    </header>
    <main id="main">
      <section className="mx-hero" aria-labelledby="mx-hero-title">
        <div className="mx-hero-art" aria-hidden="true"><div className="mx-gate-float">
          {/* Original policy-gate artwork, animated as a restrained moving surface. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/policy-gate.webp" alt="" width="1264" height="848" fetchPriority="high" /><span className="mx-gate-sheen" /><span className="mx-gate-tracer" /></div>
        </div>
        <div className="mx-wrap mx-hero-layout">
          <div className="mx-hero-copy">
            <a href="#playground" className="mx-preview"><span className="mx-beacon" /> PRE-LAUNCH PREVIEW <span className="mx-preview-divider" /> Explore the engine <Arrow /></a>
            <MorphHeadline motion={motion} />
            <p className="mx-hero-description">You run the business. Mercenta brings the goods.<br className="mx-desktop-break" /> Give agents the power to buy — inside your rules.</p>
            <div className="mx-actions"><a href="/app" className="mx-button mx-button-primary">Launch console <Arrow diagonal /></a><a href="#playground" className="mx-button mx-button-quiet">Test the guardrails <Arrow /></a></div>
            <p className="mx-disclaimer">Illustrative environment. No live orders or funds.</p><button className="mx-motion-toggle" type="button" aria-pressed={!motion} onClick={() => setMotion(!motion)}>{motion ? "Ⅱ" : "▷"}<span>{motion ? "Pause hero motion" : "Resume hero motion"}</span></button>
          </div>
          <div className="mx-art-caption"><span className="mx-cross">+</span><div><span className="mx-label">THE POLICY GATE / 001</span><p>Intelligence moves fast.<br />Control moves with it.</p></div></div>
          <div className="mx-art-status"><span className="mx-beacon" /> DETERMINISTIC BY DESIGN</div>
        </div>
        <div className="mx-wrap"><div className="mx-hero-bottom"><span className="mx-bottom-intro">Built for the<br /><strong>agent economy.</strong></span><div><span className="mx-label">VALIDATE</span><p>5 policy checks</p></div><div><span className="mx-label">PROTECT</span><p>{percent(POLICY.grossMarginFloor).replace(".0", "")} margin floor</p></div><div><span className="mx-label">AUTHORIZE</span><p>{POLICY.autoApprovalLimit.toLocaleString("en-US")} USDC limit</p></div><a href="#control" className="mx-scroll-cue" aria-label="Explore spend controls">Explore <span>↓</span></a></div></div>
      </section>

      <LiquidityBento />
      <SupplySection />

      <section className="mx-control" id="control" aria-labelledby="mx-control-title">
        <div className="mx-wrap">
          <div className="mx-section-meta"><span className="mx-label">02 / THE CONTROL LAYER</span><span className="mx-label">NOT A PROMPT. A POLICY.</span></div>
          <div className="mx-control-intro"><h2 id="mx-control-title">Give agents the keys.<br /><span>Not the blank check.</span></h2><p>Autonomy without boundaries is just risk at machine speed. Mercenta puts a deterministic checkpoint between an agent&rsquo;s intent and your money.</p></div>
          <div className="mx-control-grid">
            <div className="mx-rule-list">
              <article><span className="mx-rule-number">01</span><div><h3>Budgets that mean business.</h3><p>Available and reserved funds are checked before authorization. An agent cannot talk its way around arithmetic.</p></div><span className="mx-rule-glyph">↗</span></article>
              <article><span className="mx-rule-number">02</span><div><h3>Margin is not optional.</h3><p>Below your gross margin floor? Blocked. The rules stay the rules, even when the agent is confident.</p></div><span className="mx-rule-glyph">≠</span></article>
              <article><span className="mx-rule-number">03</span><div><h3>Uncertainty stops here.</h3><p>Unverified suppliers are blocked. Orders above the approval threshold are routed to a human.</p></div><span className="mx-rule-glyph">⊥</span></article>
            </div>
            <div className="mx-policy-envelope">
              <div className="mx-envelope-top"><BrandMark /><span className="mx-label">POLICY ENVELOPE</span><span className="mx-label">v0.3</span></div>
              <div className="mx-envelope-title">Your rules.<br /><span>Machine-enforced.</span></div>
              <div className="mx-envelope-rule"><span>Gross margin floor</span><strong>{percent(POLICY.grossMarginFloor).replace(".0", "")}<span> MIN</span></strong></div>
              <div className="mx-envelope-rule"><span>Auto-approval threshold</span><strong>{POLICY.autoApprovalLimit.toLocaleString("en-US")}<span> USDC</span></strong></div>
              <div className="mx-envelope-footer"><StatusIcon state="pass" /><span>Same input. Same decision. Every time.</span></div>
            </div>
          </div>
        </div>
      </section>

      <ScrollStory />

      <section id="playground" className="mx-playground" aria-labelledby="mx-playground-title">
        <div className="mx-wrap mx-playground-layout">
          <div className="mx-playground-copy"><span className="mx-label">04 / INTERACTIVE POLICY LAB</span><h2 id="mx-playground-title">Try to break<br /><span>the rules.</span></h2><p>Drop the margin. Change the supplier. Push the limit. See exactly where your order stops — and why.</p><div className="mx-lab-note"><span><svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6 4v16h18m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span><p>Real policy logic.<br /><strong>Illustrative money.</strong></p></div><div className="mx-legend"><span><i className="mx-indicator-pass" />Clear</span><span><i className="mx-indicator-fail" />Block</span><span><i className="mx-indicator-hold" />Review</span></div></div>
          <div className="mx-lab">
            <div className="mx-lab-header"><span><i className="mx-beacon" />POLICY LAB</span><span className="mx-label">{POLICY.version}</span></div>
            <div className="mx-scenarios" role="group" aria-label="Example policy scenarios">{SCENARIOS.map(s => <button key={s.key} type="button" aria-pressed={activeCase === s.key} className={activeCase === s.key ? "is-active" : ""} onClick={() => chooseCase(s.key)}>{s.label}</button>)}</div>
            <div className="mx-lab-fields"><label>Client price <span>USDC</span><input type="number" min="1" max="1000000" step="50" value={amount} onChange={e => { setAmount(Math.max(0, Number(e.target.value))); setActiveCase("custom"); }} /></label><label>Supplier cost <span>USDC</span><input type="number" min="0" max="1000000" step="50" value={cost} onChange={e => { setCost(Math.max(0, Number(e.target.value))); setActiveCase("custom"); }} /></label></div>
            <label className="mx-supplier-field">Supplier status<select value={supplier} onChange={e => { setSupplier(e.target.value as SupplierState); setActiveCase("custom"); }}><option value="verified">Verified supplier</option><option value="uncertain">Uncertain supplier</option></select></label>
            <div className="mx-check-heading"><span className="mx-label">CHECKPOINT</span><span className="mx-label">RESULT</span></div>
            <ul className="mx-check-list">{result.checks.map((check, index) => <li key={check.id} className={`mx-check-${check.state}`}><span className="mx-check-index">0{index + 1}</span><div><strong>{CHECK_LABELS[index]}</strong><p>{check.note}</p></div><span className="mx-check-state"><StatusIcon state={check.state} /><span>{check.state === "pass" ? "PASS" : check.state === "fail" ? "BLOCK" : "REVIEW"}</span></span></li>)}</ul>
            <div className={`mx-verdict mx-verdict-${tone}`} role="status" aria-live="polite" aria-atomic="true"><div><span className="mx-label">POLICY DECISION</span><strong>{result.decision}<Arrow /></strong></div><div><span className="mx-label">GROSS MARGIN</span><strong>{percent(result.margin)}</strong></div></div>
          </div>
        </div>
      </section>

      <section className="mx-catalog" id="catalog" aria-labelledby="mx-catalog-title">
        <div className="mx-wrap">
          <div className="mx-section-meta"><span className="mx-label">05 / THE AGENT CATALOG</span><a className="mx-text-link" href="/catalog">Explore full catalog <Arrow diagonal /></a></div>
          <h2 id="mx-catalog-title">Digital goods.<br /><span>Agent-ready.</span></h2>
          <div className="mx-catalog-layout"><div className="mx-catalog-tabs" role="tablist" aria-orientation="vertical" aria-label="Digital goods categories">{GOODS.map((item, index) => <button key={item.code} type="button" id={`mx-good-tab-${index}`} role="tab" aria-selected={good === index} aria-controls="mx-good-panel" tabIndex={good === index ? 0 : -1} onClick={() => setGood(index)} onKeyDown={e => { if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = e.key === "Home" ? 0 : e.key === "End" ? GOODS.length - 1 : (index + (["ArrowDown", "ArrowRight"].includes(e.key) ? 1 : GOODS.length - 1)) % GOODS.length; setGood(next); document.getElementById(`mx-good-tab-${next}`)?.focus(); } }}><span className="mx-label">0{index + 1}</span><span>{item.name}<small>{item.tag}</small></span><Arrow diagonal /></button>)}</div>
            <div className="mx-good-panel" id="mx-good-panel" role="tabpanel" aria-labelledby={`mx-good-tab-${good}`} tabIndex={0}><div className="mx-good-top"><span className="mx-label">MERCENTA / {currentGood.code}</span><span className="mx-label">CATALOG PREVIEW</span></div><div className="mx-good-visual" aria-hidden="true"><span>{currentGood.symbol}</span><i /><i /><i /><i /></div><div className="mx-good-copy"><span className="mx-label">{currentGood.detail}</span><h3>{currentGood.title}</h3><p>{currentGood.description}</p><a href="/catalog" className="mx-text-link">View catalog <Arrow diagonal /></a></div></div>
          </div>
        </div>
      </section>

      <BusinessPlaybooks />

      <section className="mx-evidence" aria-labelledby="mx-evidence-title"><div className="mx-wrap mx-evidence-layout"><div><span className="mx-label">07 / THE AUDIT TRAIL</span><h2 id="mx-evidence-title">Not just approved.<br /><span>Accounted for.</span></h2><p>Price. Cost. Margin. Decision.<br />The order record keeps the context together, so you can inspect the outcome instead of trusting a summary.</p><button ref={receiptButton} className="mx-text-link" type="button" onClick={() => setReceiptOpen(true)}>Inspect example record <Arrow diagonal /></button></div><div className="mx-receipt"><div className="mx-receipt-top"><BrandMark /><span className="mx-label">ILLUSTRATIVE ORDER RECORD</span></div><span className="mx-label">{ORDER.id}</span><div className="mx-receipt-amount">{CASES.order.amount.toLocaleString("en-US")}<span>USDC</span></div><dl><div><dt>Supplier cost</dt><dd>{usdc(CASES.order.cost)}</dd></div><div><dt>Platform fee ({percent(POLICY.platformFee)})</dt><dd>{usdc(CASES.order.amount * POLICY.platformFee)}</dd></div><div><dt>Gross margin</dt><dd>{percent(example.margin)}</dd></div></dl><div className="mx-receipt-bottom"><StatusIcon state="pass" />{example.decision}<span>PREVIEW ONLY</span></div></div></div></section>

      <BuildSection />
      <LandingFAQ />

      <section className="mx-final" aria-labelledby="mx-final-title"><div className="mx-wrap"><div className="mx-final-top"><span className="mx-label">THE NEXT MOVE IS YOURS.</span><span className="mx-label">MERCENTA / PRE-LAUNCH</span></div><h2 id="mx-final-title">Let agents act.<br /><span>On your terms.</span></h2><div className="mx-final-bottom"><p>Intelligent commerce.<br />Non-negotiable control.</p><a href="/app" className="mx-button mx-button-primary">Enter the console <Arrow diagonal /></a></div></div><div className="mx-final-watermark" aria-hidden="true">mercenta.</div></section>
    </main>
    <footer className="mx-footer"><div className="mx-wrap"><a href="#" className="mx-brand"><BrandMark /><span>mercenta.</span></a><p>© {new Date().getFullYear()} Mercenta · Pre-launch preview</p><div><a href="/catalog">Catalog <Arrow diagonal /></a><a href="/app">Console <Arrow diagonal /></a><a href="/status">Status <Arrow diagonal /></a><a href="#">Back to top ↑</a></div></div></footer>
    <dialog ref={dialog} className="mx-record-dialog" aria-labelledby="mx-record-title" onCancel={dismissReceipt} onClick={e => { if (e.target === e.currentTarget) dismissReceipt(); }}><div className="mx-record-inner"><div className="mx-record-heading"><span className="mx-label">ILLUSTRATIVE / NO LIVE SETTLEMENT</span><button ref={closeReceipt} type="button" onClick={dismissReceipt} aria-label="Close order record">×</button></div><h2 id="mx-record-title">{ORDER.id}</h2><p>{ORDER.units} {ORDER.unit} · {ORDER.supplier}</p><dl>{[["Client price", usdc(CASES.order.amount)], ["Supplier cost", usdc(CASES.order.cost)], ["Platform fee", usdc(CASES.order.amount * POLICY.platformFee)], ["Gross margin", percent(example.margin)], ["Decision", example.decision], ["Policy", POLICY.version]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="mx-record-note">This is an example record, not a signed receipt or proof of settlement.</p><button type="button" className="mx-button mx-button-primary" onClick={copyReceipt} aria-live="polite">{copied ? "Copied JSON ✓" : "Copy record as JSON"}<Arrow /></button></div></dialog>

  </div>;
}
