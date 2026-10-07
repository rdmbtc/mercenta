"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy, ExternalLink, FileCheck2, Fingerprint, Sparkles } from "lucide-react";

export default function ReceiptSpotlight() {
  const [copied, setCopied] = useState(false);

  const orderData = {
    id: "ORD-9021-ARC-88B",
    timestamp: "2026-10-01T11:42:09.112Z",
    agent: "devin-worker-04 (ed25519-sig: 8c41)",
    listing: "Cloud Compute H100 SXM5 Dedicated Cluster",
    quantity: "250 Compute Hours",
    supplierCost: "$1,147.00 USDC",
    customerCharge: "$1,420.00 USDC",
    grossMargin: "$273.00 USDC (+19.22%)",
    platformFee: "$21.30 USDC (1.5%)",
    netRetained: "$251.70 USDC",
    settlementTx: "0x89f41b9c328e104928b5774a10058b7762d1038b4791a82f",
    merkleRoot: "0x4b7c891028394e01928374829103948572910283",
    deliveryFingerprint: "0xec2981048b910481029485710293847581029384",
    status: "SETTLED & DELIVERED",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(orderData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="receipt"
      className="relative z-10 py-24 md:py-32 bg-[#000000] text-white border-t border-[#15181e]"
      aria-labelledby="receipt-heading"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.182em] text-[#00ca8e]">
            05 // CRYPTOGRAPHIC AUDITABILITY
          </p>
          <h2
            id="receipt-heading"
            className="mt-3 font-serif text-[38px] sm:text-[56px] font-light leading-[1.0] tracking-[-1.5px] text-white"
          >
            One atomic transaction.{" "}
            <span className="italic font-normal">One immutable receipt.</span>
          </h2>
          <p className="mt-4 text-[16px] sm:text-[18px] font-light leading-[1.55] text-[#b2b6bd]">
            No reconciliations between credit card bills and fuzzy logs. The intent, the
            rules check, the USDC settlement on Arc, and the supplier delivery fingerprint
            are fused into a single cryptographic receipt.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 1. INVERTED STAT SPOTLIGHT CARD (DESIGN.md Section 5.4)                   */}
        {/* ========================================================================= */}
        <div className="mt-12 rounded-[30px] bg-[#cacaca] p-8 sm:p-10 text-black shadow-2xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
                <Sparkles size={12} />
                INSTITUTIONAL ASSURANCE
              </span>
              <h3 className="mt-4 font-serif text-[32px] sm:text-[40px] font-light leading-[1.05] text-black">
                Zero reconciliation debt. Guaranteed mathematical truth.
              </h3>
              <p className="mt-2 text-[15px] font-sans leading-relaxed text-black/80">
                Traditional expense policies inspect after capital leaves. Mercenta acts as
                a deterministic gate before execution. Every decision is verifiable on-chain.
              </p>
            </div>

            {/* Big Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-black/15 pt-6 md:pt-0 md:pl-8 font-mono">
              <div>
                <span className="block text-[28px] sm:text-[36px] font-bold leading-tight text-black">
                  100%
                </span>
                <span className="text-[12px] uppercase text-black/70">
                  Deterministic Logic
                </span>
              </div>
              <div>
                <span className="block text-[28px] sm:text-[36px] font-bold leading-tight text-black">
                  &lt;18ms
                </span>
                <span className="text-[12px] uppercase text-black/70">
                  Gate Clearance
                </span>
              </div>
              <div>
                <span className="block text-[28px] sm:text-[36px] font-bold leading-tight text-black">
                  0
                </span>
                <span className="text-[12px] uppercase text-black/70">
                  LLM Token Votes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HARDWARE STAGE CONTAINER (DESIGN.md Section 5.7: 90px Dramatic Padding) */}
        {/* ========================================================================= */}
        <div className="mt-12 rounded-[24px] border border-[rgba(178,182,189,0.12)] bg-[#090b0e] p-6 sm:p-12 lg:p-[72px]">
          <div className="mx-auto max-w-4xl rounded-[20px] border border-[#252830] bg-[#15181e] p-6 sm:p-8 shadow-2xl">
            {/* Header with status */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#252830] pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00ca8e]/10 text-[#00ca8e]">
                  <FileCheck2 size={18} />
                </span>
                <div>
                  <h4 className="font-mono text-[14px] font-semibold text-white">
                    VERIFIED_CRYPTOGRAPHIC_RECEIPT
                  </h4>
                  <span className="font-mono text-[11px] text-[#656a76]">
                    Order #{orderData.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00ca8e]/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#00ca8e]">
                  <CheckCircle2 size={12} />
                  CLEARED ON ARC // BLOCK #4819024
                </span>
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-[#1f232b] p-2 text-[#b2b6bd] transition-colors hover:text-white"
                  title="Copy Full JSON Receipt"
                >
                  {copied ? <Check size={14} className="text-[#00ca8e]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Receipt Line Items Table */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[12px]">
              <div className="space-y-3.5">
                <div>
                  <span className="block text-[11px] text-[#656a76]">PURCHASED LINE ITEM</span>
                  <span className="text-white font-medium">{orderData.listing}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#656a76]">QUANTITY / SPEC</span>
                  <span className="text-[#b2b6bd]">{orderData.quantity}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#656a76]">BUYING AGENT IDENTITY</span>
                  <span className="text-[#14c6cb]">{orderData.agent}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#656a76]">MERKLE ROOT HASH</span>
                  <span className="text-[#b2b6bd] break-all">{orderData.merkleRoot}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between border-b border-[#252830] pb-2">
                  <span className="text-[#656a76]">Wholesale Supplier Rate:</span>
                  <span className="text-white font-semibold">{orderData.supplierCost}</span>
                </div>
                <div className="flex justify-between border-b border-[#252830] pb-2">
                  <span className="text-[#656a76]">Customer Charged Total:</span>
                  <span className="text-white font-bold text-[14px]">{orderData.customerCharge}</span>
                </div>
                <div className="flex justify-between border-b border-[#252830] pb-2">
                  <span className="text-[#656a76]">Retained Gross Margin:</span>
                  <span className="text-[#00ca8e] font-semibold">{orderData.grossMargin}</span>
                </div>
                <div className="flex justify-between border-b border-[#252830] pb-2">
                  <span className="text-[#656a76]">Mercenta Platform Fee:</span>
                  <span className="text-[#b2b6bd]">{orderData.platformFee}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-white font-semibold">Net Retained Profit:</span>
                  <span className="text-[#00ca8e] font-bold text-[14px]">{orderData.netRetained}</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Footprint Footer */}
            <div className="mt-8 rounded-[12px] bg-[#0c0e12] p-4 border border-[#252830] text-[11px] font-mono">
              <div className="flex items-center justify-between text-[#656a76] mb-2">
                <span className="flex items-center gap-1.5">
                  <Fingerprint size={12} className="text-[#7b42bc]" />
                  DELIVERY_SHA256_FINGERPRINT
                </span>
                <span className="text-[#00ca8e]">MATCHES SUPPLIER DISPATCH</span>
              </div>
              <p className="text-[#b2b6bd] break-all">{orderData.deliveryFingerprint}</p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1c2027] text-[#656a76]">
                <span>On-Chain Settlement TX: {orderData.settlementTx.slice(0, 24)}...</span>
                <a
                  href="https://testnet.mercenta.xyz"
                  className="text-[#14c6cb] hover:underline flex items-center gap-1"
                >
                  Verify in Explorer <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
