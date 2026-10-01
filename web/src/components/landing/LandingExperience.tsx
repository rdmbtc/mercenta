"use client";

import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";

const HERO_LINES = [
  ["Autonomous", "commerce."],
  ["Your business.", "Our supply."],
  ["Inventory-free", "commerce."],
];

/** Two coincident text layers dissolve through blur; the layout never changes height. */
export function MorphHeadline({ motion }: { motion: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const target = ref.current;
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let current = index;
    function synchronize() {
      clearInterval(interval); clearTimeout(settle); setPrevious(null);
      if (!motion || !inView || reduce.matches || document.hidden) return;
      interval = setInterval(() => {
        const old = current;
        current = (current + 1) % HERO_LINES.length;
        setPrevious(old); setIndex(current);
        settle = setTimeout(() => setPrevious(null), 1050);
      }, 5600);
    }
    synchronize();
    reduce.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => { clearInterval(interval); clearTimeout(settle); reduce.removeEventListener("change", synchronize); document.removeEventListener("visibilitychange", synchronize); };
    // index is advanced inside this clock; restarting it every phrase would reset the cadence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion, inView]);
  return <h1 ref={ref} id="mx-hero-title" className="mx-morph-headline">
    <span className="mx-visually-hidden">Autonomous commerce. Under control. Your business. Our supply. Inventory-free commerce.</span>
    <span className="mx-morph-stage" aria-hidden="true">
      {previous !== null && <span key={`old-${previous}`} className="mx-morph-layer is-leaving">{HERO_LINES[previous][0]}<br />{HERO_LINES[previous][1]}</span>}
      <span key={`new-${index}`} className={`mx-morph-layer${previous !== null ? " is-entering" : ""}`}>{HERO_LINES[index][0]}<br />{HERO_LINES[index][1]}</span>
    </span>
    <span className="mx-morph-anchor" aria-hidden="true">Under control.</span>
  </h1>;
}

function LinkArrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function Glyph({ type }: { type: "supply" | "rules" | "business" | "api" }) {
  const paths = { supply: "M4 7h16v13H4zM8 7V4h8v3M4 12h16M10 16h4", rules: "m12 3 8 4v5c0 5-8 9-8 9S4 17 4 12V7l8-4Zm-4 9 3 3 5-6", business: "M4 20V9l8-5 8 5v11H4Zm5 0v-7h6v7", api: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" };
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={paths[type]} stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SupplySection() {
  return <section className="mx-supply" id="business" aria-labelledby="mx-supply-title">
    <div className="mx-wrap">
      <div className="mx-section-meta"><span className="mx-label">01 / YOUR BUSINESS. OUR SUPPLY.</span><span className="mx-label">DIGITAL GOODS. NO STOCKROOM.</span></div>
      <div className="mx-supply-grid">
        <div className="mx-expansion-copy"><h2 id="mx-supply-title">You run the business.<br /><span>We bring the goods.</span></h2><p>Build a digital-goods business without stocking products yourself. Mercenta provides the catalog and supplier connections. You choose what to offer, how to price it, and the rules your agents follow.</p><a href="/catalog" className="mx-text-link">Meet your next product line <LinkArrow /></a></div>
        <div className="mx-supply-machine" aria-label="Mercenta connects digital resources to your business through your policy">
          <div className="mx-machine-top"><span className="mx-label">THE SUPPLY LAYER</span><span className="mx-label"><i className="mx-beacon" /> CATALOG → INTENT</span></div>
          <div className="mx-stock-row"><span className="mx-stock-symbol">⌘</span><div><strong>Compute & infrastructure</strong><small>Cloud capacity · GPU resources</small></div><span className="mx-stock-code">CMP</span></div>
          <div className="mx-stock-row"><span className="mx-stock-symbol">&lt;/&gt;</span><div><strong>API credits & tokens</strong><small>Resources for the next workload</small></div><span className="mx-stock-code">API</span></div>
          <div className="mx-stock-row"><span className="mx-stock-symbol">↗</span><div><strong>Keys, vouchers & subscriptions</strong><small>Digital goods from connected suppliers</small></div><span className="mx-stock-code">KEY</span></div>
          <div className="mx-supply-route" aria-hidden="true"><span /><i /><i /><i /></div>
          <div className="mx-machine-gate"><BrandMark /><div><span className="mx-label">MERCENTA / POLICY GATE</span><strong>Your terms. Before every order.</strong></div><Glyph type="rules" /></div>
          <div className="mx-machine-bottom"><Glyph type="business" /><div><strong>Your business</strong><span>You own the customer experience.</span></div><span className="mx-label">YOU / IN CONTROL</span></div>
          <p className="mx-machine-note">Concept flow · This preview does not place or fulfill orders.</p>
        </div>
      </div>
      <div className="mx-ownership-strip">
        {[{ n: "01", icon: "supply" as const, title: "Mercenta supplies the catalog.", text: "Explore digital goods and connected supplier options, without building every integration from scratch." }, { n: "02", icon: "business" as const, title: "You build the business.", text: "Own your positioning, customer relationships and pricing. Start with an offer, not a warehouse." }, { n: "03", icon: "rules" as const, title: "Your rules define the boundary.", text: "Set the budget, margin floor and approval threshold. An agent proposes; the policy decides." }].map(item => <article key={item.n}><div><Glyph type={item.icon} /><span className="mx-label">{item.n}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}
      </div>
    </div>
  </section>;
}

export function BusinessPlaybooks() {
  return <section className="mx-playbooks" aria-labelledby="mx-playbooks-title"><div className="mx-wrap">
    <div className="mx-section-meta"><span className="mx-label">06 / ONE SUPPLY LAYER. DIFFERENT BUSINESSES.</span><span className="mx-label">BUILT AROUND YOUR OFFER</span></div>
    <div className="mx-expansion-heading"><h2 id="mx-playbooks-title">Choose your market.<br /><span>Not your warehouse.</span></h2><p>A storefront, an AI product, or a resource service. Start with the customer need. Let Mercenta connect the supply.</p></div>
    <div className="mx-playbook-grid">
      {[{ num: "01", type: "business" as const, label: "DIGITAL STOREFRONT", title: "Sell an experience.", text: "Curate keys, vouchers and subscriptions for your audience. Build your brand around the offer, not around holding stock.", path: "Your audience → Digital catalog", code: "KEY / STREAM" }, { num: "02", type: "api" as const, label: "AI-NATIVE PRODUCT", title: "Keep the product running.", text: "Give agents a structured path to request compute and API credits. Keep resource acquisition inside a budget you understand.", path: "Your workload → Compute & tokens", code: "CMP / API" }, { num: "03", type: "supply" as const, label: "RESOURCE PROCUREMENT", title: "Source with a boundary.", text: "Bring digital resources into your service. Review supplier options, build a batch, and check the policy before authorization.", path: "Your service → Supplier resources", code: "SUPPLY / POLICY" }].map(item => <article key={item.num}><div className="mx-playbook-top"><Glyph type={item.type} /><span className="mx-label">{item.num}</span></div><span className="mx-label">{item.label}</span><h3>{item.title}</h3><p>{item.text}</p><div className="mx-playbook-path">{item.path}</div><div className="mx-playbook-bottom"><span className="mx-label">{item.code}</span><a href="/catalog" aria-label={`Explore catalog for ${item.label.toLowerCase()}`}><LinkArrow /></a></div></article>)}
    </div><p className="mx-section-footnote">Business concepts, not a guarantee of availability or profit. Confirm supplier terms, pricing and fulfillment in your integration.</p>
  </div></section>;
}

export function BuildSection() {
  return <section className="mx-build" id="build" aria-labelledby="mx-build-title"><div className="mx-wrap mx-build-grid"><div className="mx-expansion-copy"><span className="mx-label">08 / FROM CATALOG TO YOUR PRODUCT</span><h2 id="mx-build-title">Less checkout.<br /><span>More orchestration.</span></h2><p>Find a resource. Build a structured intent. Run it through your rules. Keep the evidence. The same language connects the catalog, your agents and your business.</p><div className="mx-build-links"><a href="/catalog" className="mx-button mx-button-quiet">Build a resource batch <LinkArrow /></a><a href="/app" className="mx-text-link">Explore the console <LinkArrow /></a></div></div><div className="mx-build-code"><div><span className="mx-label">RESOURCE → INTENT</span><span className="mx-label">ILLUSTRATIVE / DRAFT</span></div><pre aria-label="Illustrative structured resource intent"><code>{`{\n  "resource": "cloud-compute",\n  "quantity": 250,\n  "unit": "compute-hours",\n  "clientAmount": 2100,\n  "currency": "USDC",\n  "policy": "your-workspace-rules",\n  "draft": true\n}`}</code></pre><div className="mx-code-foot"><span className="mx-beacon" /> A request is not permission.</div></div></div></section>;
}
const QUESTIONS = [
  ["Can I run a business without my own inventory?", "That is the model: you build the customer-facing business, while Mercenta provides access to a digital-goods catalog and supplier connections. You do not need to stock physical products. You still own your offer, pricing, customer obligations and the supplier terms you choose."],
  ["What does Mercenta provide?", "A catalog of digital resources, a structured way to prepare resource intents, and a policy layer for checking spend, reserves, margin, supplier verification and approval limits. Catalog availability depends on the connected supplier or the clearly labeled preview snapshot."],
  ["What stays under my control?", "Your business model, pricing, budget and approval rules. An agent can propose an order, but a failed check blocks it. An amount above your approval threshold needs a human."],
  ["Are payments and delivery live in this preview?", "No. The landing playground and console are illustrative. Catalog batches are draft manifests, not submitted orders or receipts. Live payment, settlement and delivery must be connected and verified before operating a production business."],
  ["Where should I start?", "Explore the catalog, assemble a draft resource batch, then test your guardrails in the console. Use the status page to check the API and see which monitoring sources are connected — without assuming that an API response proves supplier or settlement health."],
];
export function LandingFAQ() {
  return <section className="mx-faq" aria-labelledby="mx-faq-title"><div className="mx-wrap mx-faq-grid"><div><span className="mx-label">09 / THE PRACTICAL QUESTIONS</span><h2 id="mx-faq-title">Clear answers.<br /><span>No black box.</span></h2><p>Understand the model before you build on it.</p></div><div className="mx-faq-list">{QUESTIONS.map(([question, answer], i) => <details key={question}><summary><span className="mx-label">0{i + 1}</span><span>{question}</span><i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div></div></section>;
}
