"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { ArrowUpRight, ArrowRight, Check, ShieldCheck, Globe2, Layers3, Wallet, Menu, X, ChevronRight, Sparkles, Activity, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

const scenarios = {
  approved: { label: "Healthy margin", status: "Approved & fulfilled", color: "cyan", cost: "$7.20", margin: "28%", explanation: "Payment confirmed. Margin and supplier liquidity meet your policy. Order cleared for fulfillment.", steps: ["USDC payment verified", "Margin policy passed", "Supplier purchase cleared", "Digital delivery complete"] },
  blocked: { label: "Price increase", status: "Purchase blocked", color: "amber", cost: "$10.80", margin: "−8%", explanation: "Supplier cost exceeds the sale price. No supplier purchase is submitted. Seller review is required.", steps: ["USDC payment verified", "Supplier price changed", "Margin protection triggered", "Seller review required"] },
  approval: { label: "Above limit", status: "Approval required", color: "purple", cost: "$12.00", margin: "40%", explanation: "Supplier purchase exceeds the $10 automatic-purchase limit. Execution stays paused until the seller approves.", steps: ["USDC payment verified", "Margin policy passed", "Automatic limit exceeded", "Waiting for seller approval"] },
};
type Scenario = keyof typeof scenarios;
const faqs = [
  ["What is Mercenta?", "Mercenta is a digital-commerce platform in development. It brings a supplier-backed catalogue, USDC checkout and a policy-controlled AI assistant into one merchant workspace."],
  ["Can I buy products or launch a store today?", "Not yet. This is our early-access landing page, not a live storefront. Follow @mercentaxyz on X for pilot availability and launch updates."],
  ["Does the AI have unrestricted access to my money?", "No. The planned execution flow validates every proposal against deterministic margin, budget and liquidity rules. Exceptions require seller approval. The preview above is illustrative and does not move funds."],
  ["How will payments work?", "We are building USDC checkout on Arc, starting on testnet. Fiat funding through Arc App Kit Onramp is planned, subject to provider eligibility, KYC and regional availability. Funding a wallet and paying for an order are separate steps."],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("approved");
  const current = scenarios[scenario];
  return <MotionConfig reducedMotion="user"><div className="site-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header"><a className="brand" href="#" aria-label="Mercenta home"><span className="brand-icon"><Image src="/mercenta-logo.png" alt="" width={44} height={44} priority /></span>mercenta<span className="brand-dot">.</span></a>
      <nav className="desktop-nav" aria-label="Site links"><a href="#platform">Platform</a><a href="#how-it-works">How it works</a><a href="#questions">FAQ</a></nav>
      <a className="nav-cta" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">Follow updates on X <ArrowUpRight size={15}/></a>
      <Button variant="ghost" size="icon" className="mobile-toggle" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)}>{menu ? <X/> : <Menu/>}</Button>
      {menu && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile site links">{[["Platform", "#platform"],["How it works", "#how-it-works"],["FAQ", "#questions"]].map(([label,href])=><a key={href} href={href} onClick={()=>setMenu(false)}>{label}<ArrowUpRight size={16}/></a>)}</nav>}
    </header>
    <main id="main">
      <section className="hero">
        <div className="hero-grid" aria-hidden="true"/><div className="hero-halo" aria-hidden="true"/>
        <motion.div className="hero-copy" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65}}>
          <div className="eyebrow"><span className="live-dot"/> THE NEXT CHAPTER OF DIGITAL COMMERCE <ArrowUpRight size={13}/></div>
          <h1>Your ambition.<br/>Your business.<br/><span>On autopilot.</span></h1>
          <p>Sell digital products. Settle in USDC. Let your AI assistant handle the busywork — while you stay in control.</p>
          <div className="hero-actions"><a className="primary-link" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">Follow the build on X <ArrowUpRight size={18}/></a><a className="secondary-link" href="#platform">Explore the platform <ArrowRight size={17}/></a></div>
          <div className="hero-footnote"><span className="tiny-dot"/> Early access · Building on Arc™ Network <span className="separator">/</span> Your rules. Every transaction.</div>
        </motion.div>
        <motion.div className="hero-art" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.9,delay:.15}} aria-label="Mercenta commerce network illustration">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
          <div className="orbit-label top-label"><span className="tiny-dot"/> INTELLIGENCE IN MOTION</div>
          <div className="core-logo"><Image src="/mercenta-logo.png" alt="Mercenta ribbon M logo" width={330} height={330} priority /></div>
          <div className="floating-note note-one"><span className="note-icon"><ShieldCheck size={19}/></span><div>Margin protected<small>Your policy comes first</small></div><Check size={14}/></div>
          <div className="floating-note note-two"><span className="coin-symbol">$</span><div>USDC native<small>Building on Arc</small></div><ArrowUpRight size={14}/></div>
          <span className="orb orb-a"/><span className="orb orb-b"/><div className="orbit-label bottom-label">SELL <span>·</span> SETTLE <span>·</span> FULFILL</div>
        </motion.div>
      </section>
      <div className="ecosystem"><span>ONE CONNECTED<br/><b>COMMERCE STACK</b></span><div>Arc</div><div><span className="usdc-mark">$</span> USDC</div><div><Layers3 size={23}/> AppRoute</div><div><Sparkles size={23}/> AI assisted</div><small>Planned integrations<br/>Not an endorsement</small></div>
      <section id="platform" className="section platform">
        <div className="section-heading"><div><span className="kicker">01 / THE MERCHANT ADVANTAGE</span><h2>Less operating.<br/><span>More building.</span></h2></div><p>A storefront is just the start. Give your business an operating layer that connects products, payments and decisions.</p></div>
        <div className="feature-grid"><article className="feature-card catalogue-card"><div className="feature-icon"><Layers3/></div><h3>A catalogue.<br/>Not a blank canvas.</h3><p>Bring supplier-backed digital products to your customers. One connected catalogue, without stocking physical inventory.</p><div className="product-tiles" aria-label="Planned catalogue categories">{[["G", "Gaming", "cyan"],["↗", "Gift cards", "purple"],["S", "Software", "blue"]].map(([icon,label,color])=><div key={label} className={color}><strong>{icon}</strong><span>{label}</span></div>)}</div><span className="card-caption">CATALOGUE SYNC / APPRoute</span></article>
          <article className="feature-card payment-card"><div className="feature-icon"><Wallet/></div><h3>Digital money.<br/>Real possibilities.</h3><p>USDC payments on Arc. Planned fiat onramp support helps customers fund their wallets without a crypto scavenger hunt.</p><div className="payment-visual"><span className="payment-node"><Globe2 size={26}/></span><span className="dashed-line"/><span className="big-coin">$</span><span className="dashed-line"/><span className="payment-node"><Image src="/mercenta-logo.png" alt="Mercenta" width={48} height={48}/></span></div><span className="card-caption">USDC / Arc · ONRAMP PLANNED</span></article>
          <article className="feature-card policy-card"><div className="feature-icon"><ShieldCheck/></div><h3>Autonomy.<br/>With boundaries.</h3><p>Your assistant works inside your rules. Margin floors, spending limits and human approval keep you in the driver’s seat.</p><div className="policy-lines"><div><span>Minimum margin</span><b>15% <Check size={13}/></b></div><div><span>Purchase limit</span><b>Defined by you <LockKeyhole size={13}/></b></div><div><span>Outside policy</span><b className="amber-text">Ask the seller <ArrowUpRight size={13}/></b></div></div><span className="card-caption">ILLUSTRATIVE POLICY CONFIGURATION</span></article></div>
      </section>
      <section className="section operator-section" aria-labelledby="operator-title"><div className="operator-copy"><span className="kicker">02 / MEET YOUR OPERATOR</span><h2 id="operator-title">Works for you.<br/><span>Answers to you.</span></h2><p>Not another chatbot with a checkout button. An assistant built around the decisions that keep a business healthy.</p><ul>{["Checks margin before purchasing", "Escalates decisions outside your limits", "Leaves a clear trail of every action"].map(t=><li key={t}><Check size={16}/>{t}</li>)}</ul><div className="preview-disclaimer"><Activity size={16}/><span>Interactive product preview.<br/>Illustrative data. No funds move.</span></div></div>
        <div className="console"><div className="console-top"><span><span className="tiny-dot"/> MERC / OPERATOR</span><span className="preview-badge">PREVIEW</span></div><div className="scenario-picker" aria-label="Choose a preview scenario">{(Object.keys(scenarios) as Scenario[]).map(key=><Button key={key} variant="ghost" className={scenario===key ? "selected" : ""} aria-pressed={scenario===key} onClick={()=>setScenario(key)}>{scenarios[key].label}</Button>)}</div><div className="console-order"><div><span className="muted-label">EXAMPLE ORDER · #MRC-1042</span><h3>Digital gift card</h3></div><span className="order-price">{scenario === "approval" ? "20.00" : "10.00"} <small>USDC</small></span></div><div className="console-metrics"><div><span>Supplier quote</span><strong>{current.cost}</strong></div><div><span>Est. gross margin¹</span><strong className={scenario==="blocked" ? "amber-text" : "cyan-text"}>{current.margin}</strong></div></div><div aria-live="polite"><div className="decision-list">{current.steps.map((step,i)=><motion.div key={scenario+step} initial={{opacity:0,x:6}} animate={{opacity:1,x:0}} transition={{delay:i*.08}}><span className={i>1 && scenario!=="approved" ? "step-warning" : "step-check"}>{i>1 && scenario!=="approved" ? "!" : <Check size={12}/>}</span>{step}<span className="step-index">0{i+1}</span></motion.div>)}</div><div className={"decision-result "+current.color}><ShieldCheck size={19}/><div><strong>{current.status}</strong><p>{current.explanation}</p></div></div></div><div className="console-bottom">¹ Assumes USD/USDC parity; excludes fees.<span><LockKeyhole size={11}/> POLICY FIRST</span></div></div>
      </section>
      <section id="how-it-works" className="section workflow"><div className="section-heading"><div><span className="kicker">03 / FROM IDEA TO OPERATION</span><h2>Your next business.<br/><span>A clearer path.</span></h2></div><p>We’re connecting the moving parts, so you can focus on the part that matters: your customers.</p></div><div className="steps">{[["01", "Make it yours", "Choose your catalogue. Set prices, margin floors and the limits your assistant must follow."],["02", "Let commerce flow", "Customers pay in USDC. Verified orders move through policy checks to supplier fulfillment."],["03", "Stay in control", "See every decision, review exceptions and understand what your business earns."]].map(([n,title,body])=><article key={n}><span className="step-number">{n}</span><ArrowRight size={19}/><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section id="questions" className="section faq"><div><span className="kicker">A LITTLE MORE CLARITY</span><h2>Good questions.<br/><span>Honest answers.</span></h2></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<ChevronRight size={18}/></summary><p>{a}</p></details>)}</div></section>
      <section className="final-cta"><div className="cta-glow"/><span className="kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Small team.<br/><span>Big merchant energy.</span></h2><p>Follow the build and pilot announcements on X. No signup is available yet.</p><a className="primary-link" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">Follow @mercentaxyz <ArrowUpRight size={18}/></a><span className="cta-foot">Pilot updates on X · No registration yet</span></section>
    </main>
    <footer><a className="brand" href="#">mercenta<span className="brand-dot">.</span></a><span>Sell. Settle. Fulfill.</span><div><a href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">X / Twitter <ArrowUpRight size={13}/></a><a href="#questions">FAQ</a><span>© {new Date().getFullYear()} Mercenta</span></div></footer>
    <p className="brand-attribution">Arc is a trademark of Circle Internet Group, Inc. and/or its affiliates. Mercenta is independently developed; no Circle partnership or endorsement is implied.</p>
  </div></MotionConfig>;
}
