"use client";
import {ChevronDown,Wallet,Globe,ShieldCheck,LifeBuoy} from 'lucide-react';
const QUESTIONS=[
 {Icon:Wallet,q:'Do I need a wallet to start?',a:'No. Explore products and prepare a task without signing in. A verified wallet session is needed for account tools and permitted Testnet actions.'},
 {Icon:Globe,q:'How do I choose the right region?',a:'Choose the region where the product will be redeemed. The catalogue groups supported regions inside one product card. Worldwide does not override a product’s own activation rules.'},
 {Icon:ShieldCheck,q:'Can the agent spend without asking?',a:'Not by default. Review the proposal first, or explicitly authorize one time-limited, capped Testnet purchase. A draft and a model response are never permission to spend.'},
 {Icon:LifeBuoy,q:'Are real purchases and refunds available?',a:'Mainnet checkout is still closed. Testnet delivery cannot be redeemed. Payment or delivery problems go to Mercenta Support; refund decisions and payments are handled manually by the owner.'},
];
export function LandingQuestions(){return <section className="cl-section cl-wrap pd-faq" aria-labelledby="questions-title" data-reveal><div className="cl-heading"><p className="cl-eyebrow">BEFORE YOUR FIRST STEP</p><h2 id="questions-title">Clear answers.<br/>No fine-print surprises.</h2></div><div>{QUESTIONS.map(({Icon,q,a})=><details key={q}><summary><Icon size={19} strokeWidth={1.5} aria-hidden="true"/><span>{q}</span><ChevronDown size={17} aria-hidden="true"/></summary><p>{a}</p></details>)}</div></section>}
