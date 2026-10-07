"use client";

import { ArrowRight, CheckCircle2, Coins, ListChecks, ShieldCheck, Timer, Zap } from "lucide-react";

const TARGETS = [
  {
    icon: Timer,
    label: "Gateway Clearance",
    value: "<18ms",
    note: "deterministic execution speed",
  },
  {
    icon: ListChecks,
    label: "Rules per Intent",
    value: "5 of 5",
    note: "fixed evaluation order",
  },
  {
    icon: ShieldCheck,
    label: "Model LLM Vote",
    value: "0.0%",
    note: "arithmetic decisions only",
  },
  {
    icon: Coins,
    label: "Settlement Asset",
    value: "USDC",
    note: "Arc · Base · Solana clearing",
  },
];

export default function FlagshipCTA() {
  return (
    <section className="relative z-10 py-24 md:py-32 bg-[#000000] text-white border-t border-[#15181e]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Operating Targets Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#00ca8e]" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.182em] text-[#b2b6bd]">
              OPERATING STANDARDS // SLA TARGETS
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TARGETS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="rounded-[18px] border border-[#252830] bg-[#0c0e12] p-5 font-mono"
                >
                  <Icon size={18} className="text-[#14c6cb] mb-3" />
                  <span className="block text-[11px] uppercase text-[#656a76]">
                    {t.label}
                  </span>
                  <p className="text-[26px] sm:text-[32px] font-bold text-white mt-1">
                    {t.value}
                  </p>
                  <p className="text-[11px] text-[#b2b6bd] mt-1">{t.note}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flagship Machined Dark Chrome CTA Card */}
        <div
          className="relative overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.14)] p-8 sm:p-14 lg:p-16 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgb(35, 36, 40) 0%, rgb(12, 13, 16) 100%)",
          }}
        >
          {/* Subtle Ambient Bezel Highlight */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#7b42bc]/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
              <Zap size={12} className="text-[#ffcf25]" />
              INSTANT SANDBOX ONBOARDING
            </span>

            <h2 className="mt-5 font-serif text-[36px] sm:text-[52px] font-light leading-[1.0] tracking-[-1.5px] text-white">
              Give your AI agents a budget{" "}
              <span className="italic font-normal">they cannot break.</span>
            </h2>

            <p className="mt-4 text-[16px] sm:text-[18px] font-light leading-relaxed text-[#b2b6bd]">
              Deploy the Mercenta SDK to your agents in minutes. Run in the testnet
              sandbox first with zero financial risk. Same deterministic rules, same
              receipts, zero capital exposed.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="https://testnet.mercenta.xyz"
                className="inline-flex items-center gap-2 rounded-[8px] bg-white px-6 py-3.5 text-[14px] font-semibold text-black style-black transition-all hover:bg-white/90 hover:translate-y-[-1px]"
              >
                Open Practice Network
                <ArrowRight size={15} />
              </a>
              <a
                href="https://docs.mercenta.xyz"
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#3b3d45] bg-[#15181e] px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:border-[#656a76]"
              >
                Read Developer Guide
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-[12px] font-mono text-[#b2b6bd]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#00ca8e]" />
                Zero setup fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#00ca8e]" />
                Arc & Base USDC Native
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#00ca8e]" />
                OpenAPI & Python SDK
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
