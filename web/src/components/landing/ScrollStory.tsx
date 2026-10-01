"use client";

import { useEffect, useRef, useState } from "react";
import { CASES, ORDER, POLICY, evaluatePolicy, percent, usdc } from "@/lib/policy";
import BrandMark from "./BrandMark";

const CHAPTERS = [
  { label: "Intent", title: "An agent has a plan.", text: "It needs 250 compute hours. It submits the listing, quantity, price and supplier. The request is structured. The money has not moved.", note: "A request is not permission." },
  { label: "Policy", title: "Your rules take over.", text: "Spend balance. Reserved funds. Margin. Supplier. Approval limit. Five deterministic checks run in order — no model gets a vote.", note: "Scroll to run all five checks." },
  { label: "Decision", title: "The numbers decide.", text: "This order meets every condition. It clears the policy gate. A failing check would block it; an order above the threshold would need a human.", note: "Clear. Block. Or ask a human." },
  { label: "Record", title: "Nothing gets lost.", text: "The amount, supplier cost, fee and decision stay together in an inspectable order record. Settlement and delivery are planned, not live in this preview.", note: "A trail, not a black box." },
] as const;
const LABELS = ["Spend balance", "Free after reserves", "Margin floor", "Supplier verified", "Approval limit"];
const EXAMPLE = evaluatePolicy(CASES.order.amount, CASES.order.cost, CASES.order.supplier);
const CHECK_VALUES = [
  usdc(POLICY.availableToSpend),
  usdc(POLICY.availableToSpend - POLICY.reserved),
  `${percent(EXAMPLE.margin)} ≥ ${percent(POLICY.grossMarginFloor)}`,
  "Price & availability confirmed",
  `${usdc(CASES.order.amount)} ≤ ${usdc(POLICY.autoApprovalLimit)}`,
];

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Tick({ pending = false }: { pending?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" /><path d={pending ? "M12 7v5l3 2" : "m7.5 12 3 3 6-6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Scene({ stage, checks = 5 }: { stage: number; checks?: number }) {
  if (stage === 0) return <div className="ms-order-card">
    <div className="ms-card-title"><span className="mx-label">ORDER INTENT</span><span className="ms-tag">Draft</span></div>
    <div className="ms-order-item"><span className="ms-chip-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" /><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5M9 9h6v6H9z" stroke="currentColor" /></svg></span><div><h3>Cloud compute</h3><p>{ORDER.units} {ORDER.unit}</p></div></div>
    <div className="ms-order-amount"><span>{CASES.order.amount.toLocaleString("en-US")}</span><span>USDC</span></div>
    <dl className="ms-details"><div><dt>Supplier</dt><dd>{ORDER.supplier}</dd></div><div><dt>Supplier cost</dt><dd>{usdc(CASES.order.cost)}</dd></div><div><dt>Order</dt><dd>{ORDER.id}</dd></div></dl>
    <div className="ms-card-bottom"><span className="ms-neutral-dot" />Awaiting policy evaluation <span>01 / 04</span></div>
  </div>;
  if (stage === 1) return <div className="ms-policy-card">
    <div className="ms-policy-title"><BrandMark /><div><span className="mx-label">MERCENTA POLICY ENGINE</span><h3>Permission is earned.</h3></div><span className="ms-check-count">{checks}<small>/ 5</small></span></div>
    <ol className="ms-policy-checks">{EXAMPLE.checks.map((check, index) => <li key={check.id} data-complete={index < checks}><span className="ms-policy-index">0{index + 1}</span><div><strong>{LABELS[index]}</strong><p>{CHECK_VALUES[index]}</p></div><span className="ms-policy-result"><Tick pending={index >= checks} /><span>{index < checks ? "PASS" : "WAIT"}</span></span></li>)}</ol>
    <div className="ms-policy-foot"><span>Deterministic, not probabilistic.</span><span className="mx-label">POLICY v0.3</span></div>
  </div>;
  if (stage === 2) return <div className="ms-decision-card">
    <div className="ms-card-title"><span className="mx-label">POLICY DECISION</span><span className="ms-tag ms-tag-pass">5 / 5 passed</span></div>
    <div className="ms-decision-seal" aria-hidden="true"><span /><span /><svg width="44" height="44" viewBox="0 0 48 48" fill="none"><path d="m12 24 8 8 16-17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
    <h3>{EXAMPLE.decision}<span>.</span></h3><p>All five checks passed.<br />The illustrative order is authorized.</p>
    <div className="ms-decision-values"><div><span>Gross margin</span><strong>{percent(EXAMPLE.margin)}</strong></div><div><span>Approval limit</span><strong>{POLICY.autoApprovalLimit.toLocaleString("en-US")} <small>USDC</small></strong></div></div>
    <div className="ms-card-bottom"><Tick />Policy-authorized. Not settled.<span>03 / 04</span></div>
  </div>;
  return <div className="ms-record-card">
    <div className="ms-record-brand"><BrandMark /><span className="mx-label">ILLUSTRATIVE ORDER RECORD</span></div>
    <div className="ms-record-id"><span className="mx-label">{ORDER.id}</span><span className="ms-record-seal"><Tick />{EXAMPLE.decision}</span></div>
    <div className="ms-record-amount">{CASES.order.amount.toLocaleString("en-US")}<span>USDC</span></div>
    <dl className="ms-details"><div><dt>Supplier cost</dt><dd>{usdc(CASES.order.cost)}</dd></div><div><dt>Platform fee ({percent(POLICY.platformFee)})</dt><dd>{usdc(CASES.order.amount * POLICY.platformFee)}</dd></div><div><dt>Gross margin</dt><dd>{percent(EXAMPLE.margin)}</dd></div></dl>
    <div className="ms-record-footer"><span>Context preserved.</span><span className="mx-label">NO LIVE SETTLEMENT</span></div>
  </div>;
}

export default function ScrollStory() {
  const root = useRef<HTMLElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [stage, setStage] = useState(0);
  const [checks, setChecks] = useState(0);
  const active = useRef({ stage: 0, checks: 0 });
  const frame = useRef(0);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let enabled = false;
    function readScroll() {
      frame.current = 0;
      if (!section || disposed || !enabled) return;
      const pin = section.querySelector<HTMLElement>(".ms-pin");
      if (!pin) return;
      const top = parseFloat(getComputedStyle(pin).top) || 0;
      const distance = Math.max(1, section.offsetHeight - pin.offsetHeight);
      const progress = Math.max(0, Math.min(1, (top - section.getBoundingClientRect().top) / distance));
      const nextStage = Math.min(3, Math.floor(progress * 4));
      const local = Math.max(0, Math.min(1, progress * 4 - nextStage));
      const nextChecks = nextStage < 1 ? 0 : nextStage > 1 ? 5 : Math.min(5, Math.floor(local * 6));
      section.style.setProperty("--ms-progress", progress.toFixed(5));
      section.style.setProperty("--ms-local", local.toFixed(5));
      section.style.setProperty("--ms-drift", `${(progress - .5) * 32}px`);
      if (active.current.stage !== nextStage) {
        active.current.stage = nextStage;
        setStage(nextStage);
      }
      if (active.current.checks !== nextChecks) {
        active.current.checks = nextChecks;
        setChecks(nextChecks);
      }
    }
    function schedule() {
      if (!frame.current && !disposed && enabled) frame.current = requestAnimationFrame(readScroll);
    }
    function configure() {
      // Compact/landscape screens and reduced-motion users get all four readable scenes.
      enabled = !reduced.matches && window.innerHeight >= (window.innerWidth < 700 ? 840 : 720);
      setEnhanced(enabled);
      section?.setAttribute("data-enhanced", String(enabled));
      schedule();
    }
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", configure, { passive: true });
    reduced.addEventListener("change", configure);
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", configure);
      reduced.removeEventListener("change", configure);
      observer.disconnect();
    };
  }, []);

  function goToChapter(index: number) {
    const section = root.current;
    if (!section) return;
    const pin = section.querySelector<HTMLElement>(".ms-pin");
    if (!pin) return;
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    const distance = Math.max(1, section.offsetHeight - pin.offsetHeight);
    const target = window.scrollY + section.getBoundingClientRect().top - top + distance * ((index + .12) / 4);
    window.scrollTo({ top: target, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <section ref={root} id="architecture" className="mx-story" data-enhanced={enhanced} data-stage={stage} aria-labelledby="ms-title">
    <div className="ms-pin">
      <div className="mx-wrap ms-inner">
        <div className="ms-meta"><span className="mx-label">03 / ONE ORDER, END TO END</span><span className="mx-label">SCROLL TO FOLLOW THE TRANSACTION ↓</span></div>
        <div className="ms-stage-layout">
          <div className="ms-copy">
            <h2 id="ms-title">One order.<br /><span> Every checkpoint.</span></h2>
            <div className="ms-chapter-copy">{CHAPTERS.map((chapter, index) => <div key={chapter.label} className="ms-chapter" data-active={stage === index} aria-hidden={stage !== index}>
              <span className="ms-chapter-number">0{index + 1}<span> / 04</span></span>
              <h3>{chapter.title}</h3><p>{chapter.text}</p><div className="ms-chapter-note"><Arrow /><span>{chapter.note}</span></div>
            </div>)}</div>
            <p className="ms-static-intro">Follow an illustrative compute order through four checkpoints. The model proposes. The policy decides.</p>
            <a className="ms-lab-link mx-text-link" href="#playground">Then test the rules yourself <Arrow /></a>
          </div>
          <div className="ms-visual" aria-label="Scroll-driven illustrative order lifecycle">
            {/* Existing hero artwork becomes a quiet, scroll-linked backdrop, never a new fake logo. */}
            <div className="ms-visual-art" aria-hidden="true" />
            <div className="ms-visual-top"><span className="mx-label">MERCENTA / TRANSACTION VIEW</span><span className="ms-scene-counter">0{stage + 1}<span>/04</span></span></div>
            <div className="ms-flow" aria-hidden="true"><div className="ms-flow-line"><span /></div><div data-reached={stage >= 0}><span>&gt;_</span><small>Agent</small></div><div data-reached={stage >= 1}><BrandMark /><small>Policy</small></div><div data-reached={stage >= 2}><Tick /><small>Decision</small></div><div data-reached={stage >= 3}><span>≡</span><small>Record</small></div></div>
            <div className="ms-scenes">{CHAPTERS.map((chapter, index) => <div key={chapter.label} className="ms-scene" data-active={stage === index} aria-hidden={stage !== index}>
              <Scene stage={index} checks={checks} />
            </div>)}</div>
            <div className="ms-visual-foot"><span className="ms-preview-dot" />ILLUSTRATIVE TRANSACTION<span>NO LIVE FUNDS</span></div>
          </div>
        </div>
        <nav className="ms-chapter-nav" aria-label="Transaction chapters"><div className="ms-progress-track" aria-hidden="true"><span /></div>{CHAPTERS.map((chapter, index) => <button key={chapter.label} type="button" onClick={() => goToChapter(index)} aria-current={stage === index ? "step" : undefined} aria-label={`Go to chapter ${index + 1}: ${chapter.label}`} data-complete={stage > index}><span className="ms-nav-number">0{index + 1}</span><span>{chapter.label}</span><span className="ms-nav-indicator" aria-hidden="true">{stage > index ? "✓" : "↗"}</span></button>)}</nav>
      </div>
    </div>
    <div className="ms-fallback mx-wrap">{CHAPTERS.map((chapter, index) => <article key={chapter.label} className="ms-fallback-chapter"><div><span className="mx-label">0{index + 1} / {chapter.label}</span><h3>{chapter.title}</h3><p>{chapter.text}</p></div><Scene stage={index} /></article>)}</div>
  </section>;
}
