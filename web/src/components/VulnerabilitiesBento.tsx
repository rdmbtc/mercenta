"use client";

import { useState } from "react";
import { Check, CheckCircle2, Receipt, Repeat, TrendingDown, XCircle } from "lucide-react";

export default function VulnerabilitiesBento() {
  const [retryCount] = useState(11);
  const [sellingPrice, setSellingPrice] = useState(380);
  const wholesaleCost = 400; // Wholesale cost is $400

  const margin = ((sellingPrice - wholesaleCost) / sellingPrice) * 100;
  const isLoss = margin < 12; // 12% is Mercenta floor

  return (
    <section
      id="vulnerabilities"
      className="relative z-10 py-24 md:py-32 bg-[#000000] text-white border-t border-[#15181e]"
      aria-labelledby="vulnerabilities-title"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Eyebrow and Section Header */}
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.182em] text-[#e62b1e]">
            01 // THE VULNERABILITIES OF UNGUARDED AGENTS
          </p>
          <h2
            id="vulnerabilities-title"
            className="mt-3 font-serif text-[38px] sm:text-[56px] font-light leading-[1.0] tracking-[-1.5px] text-white"
          >
            An agent with a credit card is an{" "}
            <span className="italic font-normal">unbounded financial liability.</span>
          </h2>
          <p className="mt-5 text-[16px] sm:text-[18px] font-light leading-[1.55] text-[#b2b6bd]">
            Models optimize for statistical probability, not corporate treasury solvency.
            Without hardware-enforced boundaries, three structural failures occur repeatedly.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: The Infinite Retry Loop (7 Cols) */}
          <div className="lg:col-span-7 rounded-[30px] border border-[rgba(178,182,189,0.12)] bg-[#15181e] p-8 flex flex-col justify-between transition-all hover:border-[rgba(178,182,189,0.25)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e62b1e]/10 border border-[#e62b1e]/20 px-3 py-1 font-mono text-[11px] font-semibold text-[#e62b1e]">
                  <Repeat size={12} />
                  FATAL FLAW // 01
                </span>
                <span className="font-mono text-[12px] text-[#656a76]">
                  DRAIN_RISK: CRITICAL
                </span>
              </div>

              <h3 className="mt-6 font-serif text-[28px] sm:text-[32px] font-light leading-[1.1] text-white">
                The Retry Death Spiral: Buying the same asset eleven times
              </h3>
              <p className="mt-3 text-[15px] font-light leading-relaxed text-[#b2b6bd]">
                A vendor API times out with an HTTP 504. The model automatically retries with
                exponential backoff, unaware the payment cleared on the first attempt. By
                Monday morning, the credit line is completely depleted across duplicate
                valid orders.
              </p>

              {/* Interactive Retry Simulator Visual */}
              <div className="mt-6 rounded-[16px] bg-[#0c0e12] p-5 border border-[#252830]">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#656a76] pb-3 border-b border-[#1c2027]">
                  <span>SIMULATED_RETRY_ENGINE</span>
                  <span className="text-[#e62b1e]">
                    Duplicate Transactions: {retryCount}x
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-[10px] bg-[#15181e] p-3 border border-[#252830]">
                    <span className="text-[11px] font-mono text-[#656a76]">
                      Unguarded Agent Drain
                    </span>
                    <p className="mt-1 text-[22px] font-mono font-semibold text-[#e62b1e]">
                      ${(retryCount * 850).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-[#b2b6bd]">
                      11 identical API token bundles charged
                    </span>
                  </div>

                  <div className="rounded-[10px] bg-[#00ca8e]/10 p-3 border border-[#00ca8e]/20">
                    <span className="text-[11px] font-mono text-[#00ca8e]">
                      Mercenta Policy Enclave
                    </span>
                    <p className="mt-1 text-[22px] font-mono font-semibold text-white">
                      $850.00
                    </p>
                    <span className="text-[11px] text-[#00ca8e]">
                      Pre-spend lock stopped duplicate calls #2–#11
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 pt-4 border-t border-[#252830] text-[13px] font-mono text-[#00ca8e]">
              <Check size={16} />
              <span>
                Mercenta reserves supplier funds in USDC escrow before calling any supplier.
              </span>
            </div>
          </div>

          {/* Card 2: Negative Margin Hallucination (5 Cols) */}
          <div className="lg:col-span-5 rounded-[30px] border border-[rgba(178,182,189,0.12)] bg-[#15181e] p-8 flex flex-col justify-between transition-all hover:border-[rgba(178,182,189,0.25)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#7b42bc]/10 border border-[#7b42bc]/20 px-3 py-1 font-mono text-[11px] font-semibold text-[#c490ff]">
                  <TrendingDown size={12} />
                  FATAL FLAW // 02
                </span>
                <span className="font-mono text-[12px] text-[#656a76]">
                  MARGIN_ARBITRAGE
                </span>
              </div>

              <h3 className="mt-6 font-serif text-[28px] sm:text-[32px] font-light leading-[1.1] text-white">
                Selling wholesale at a loss without realizing
              </h3>
              <p className="mt-3 text-[15px] font-light leading-relaxed text-[#b2b6bd]">
                LLMs have zero mathematical instinct for gross margin. If a supplier&apos;s
                price moves intraday, the agent quotes yesterday’s rate to your customer
                and settles at a direct financial loss.
              </p>

              {/* Interactive Margin Loss Calculator */}
              <div className="mt-6 rounded-[16px] bg-[#0c0e12] p-5 border border-[#252830]">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#656a76] pb-2">
                  <span>Customer Quoted Price</span>
                  <span className="text-white font-semibold">${sellingPrice} USDC</span>
                </div>
                <input
                  type="range"
                  min="320"
                  max="520"
                  step="10"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full accent-[#7b42bc]"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#656a76]">Wholesale Cost: ${wholesaleCost}</span>
                  <span
                    className={
                      isLoss ? "text-[#e62b1e] font-semibold" : "text-[#00ca8e] font-semibold"
                    }
                  >
                    Margin: {margin.toFixed(1)}% (Floor: 12.0%)
                  </span>
                </div>
                <div className="mt-3 text-[11px] font-mono">
                  {isLoss ? (
                    <span className="text-[#e62b1e] flex items-center gap-1.5">
                      <XCircle size={13} />
                      CIRCUIT TRIPPED: Refused before payment
                    </span>
                  ) : (
                    <span className="text-[#00ca8e] flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      MARGIN CLEARED: Deal approved
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 pt-4 border-t border-[#252830] text-[13px] font-mono text-[#00ca8e]">
              <Check size={16} />
              <span>
                Mercenta enforces an immutable 12% gross margin floor on every order.
              </span>
            </div>
          </div>

          {/* Card 3: The Reconciliation Black Hole (12 Cols Full-Width) */}
          <div className="lg:col-span-12 rounded-[30px] border border-[rgba(178,182,189,0.12)] bg-[#15181e] p-8 lg:p-10 transition-all hover:border-[rgba(178,182,189,0.25)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#14c6cb]/10 border border-[#14c6cb]/20 px-3 py-1 font-mono text-[11px] font-semibold text-[#14c6cb]">
                  <Receipt size={12} />
                  FATAL FLAW // 03
                </span>
                <h3 className="mt-5 font-serif text-[28px] sm:text-[36px] font-light leading-[1.05] text-white">
                  The bank statement reconciliation black hole
                </h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-[#b2b6bd]">
                  Corporate credit cards send statements days later stripped of all context:
                  an aggregate charge and an ambiguous merchant code. Nobody in finance can
                  tie that charge back to which prompt, agent, customer, or deliverable it
                  belonged to.
                </p>
                <div className="mt-6 flex items-center gap-2 text-[13px] font-mono text-[#00ca8e]">
                  <Check size={16} />
                  <span>One unified cryptographic receipt: Intent + Settlement + Delivery.</span>
                </div>
              </div>

              {/* Side-by-Side Comparison Mockup */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Traditional Bank Statement */}
                <div className="rounded-[16px] bg-[#0c0e12] p-5 border border-[#e62b1e]/30">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#e62b1e] pb-2 border-b border-[#252830]">
                    <span>TRADITIONAL CREDIT CARD</span>
                    <span>MISSING DATA</span>
                  </div>
                  <div className="mt-4 space-y-3 font-mono text-[12px] text-[#656a76]">
                    <div>
                      <span className="block text-[10px] text-[#474c56]">DATE / MERCHANT</span>
                      <span className="text-[#b2b6bd]">09/28 STRIPE*CLOUD_SVCS</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#474c56]">AMOUNT</span>
                      <span className="text-white font-semibold">$4,250.00 USD</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#474c56]">PROMPT / CONTEXT</span>
                      <span className="text-[#e62b1e] italic">None (Stripped by Visa/MC)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#474c56]">DELIVERABLE PROOF</span>
                      <span className="text-[#e62b1e] italic">Unknown (Manual Guesswork)</span>
                    </div>
                  </div>
                </div>

                {/* Mercenta Unified Atomic Receipt */}
                <div className="rounded-[16px] bg-[#0c0e12] p-5 border border-[#00ca8e]/40 shadow-[0_0_30px_rgba(0,202,142,0.06)]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#00ca8e] pb-2 border-b border-[#252830]">
                    <span>MERCENTA ATOMIC RECEIPT</span>
                    <span>VERIFIED 100%</span>
                  </div>
                  <div className="mt-4 space-y-3 font-mono text-[12px]">
                    <div>
                      <span className="block text-[10px] text-[#656a76]">ORDER // INTENT</span>
                      <span className="text-white">ORD-9021 · 250h H100 GPU</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#656a76]">AGENT ID // KEY</span>
                      <span className="text-[#14c6cb]">devin-04 (ed25519-sig: 8c41)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#656a76]">SETTLEMENT</span>
                      <span className="text-white font-semibold">$1,420.00 USDC (Arc Block #4819024)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#656a76]">DELIVERY FINGERPRINT</span>
                      <span className="text-[#00ca8e]">SHA256: 0x9f4a...e12c (Confirmed)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
