"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

interface TelemetryItem {
  id: string;
  agent: string;
  category: string;
  sku: string;
  amount: string;
  margin: string;
  latency: string;
  chain: string;
  status: "cleared" | "blocked" | "held";
}

const INITIAL_STREAM: TelemetryItem[] = [
  {
    id: "tx-8812",
    agent: "devin-04",
    category: "Cloud Compute",
    sku: "MR-CMP-H100",
    amount: "$1,420.00",
    margin: "+19.2%",
    latency: "14ms",
    chain: "Arc",
    status: "cleared",
  },
  {
    id: "tx-8813",
    agent: "claude-3.7-fin",
    category: "Developer API",
    sku: "MR-API-1000",
    amount: "$850.00",
    margin: "+16.0%",
    latency: "12ms",
    chain: "Base",
    status: "cleared",
  },
  {
    id: "tx-8814",
    agent: "openclaw-worker",
    category: "Gaming Keys",
    sku: "MR-GMG-ST01",
    amount: "$240.00",
    margin: "+14.5%",
    latency: "18ms",
    chain: "Solana",
    status: "cleared",
  },
  {
    id: "tx-8815",
    agent: "rogue-subagent",
    category: "Unverified Spend",
    sku: "UNKNOWN-EXT",
    amount: "$14,500.00",
    margin: "-4.2%",
    latency: "9ms",
    chain: "Arc",
    status: "blocked",
  },
  {
    id: "tx-8816",
    agent: "cursor-composer",
    category: "Streaming Media",
    sku: "MR-STM-PREM",
    amount: "$79.99",
    margin: "+18.0%",
    latency: "15ms",
    chain: "Base",
    status: "cleared",
  },
  {
    id: "tx-8817",
    agent: "autogpt-agent-9",
    category: "Micro-Donations",
    sku: "MR-DON-INST",
    amount: "$25.00",
    margin: "+12.0%",
    latency: "11ms",
    chain: "Arc",
    status: "cleared",
  },
];

export default function TelemetryRibbon() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative z-10 w-full overflow-hidden border-y border-[rgba(178,182,189,0.12)] bg-[#050608]/90 py-2.5 backdrop-blur-md"
      aria-label="Live settlement stream ticker"
    >
      <div className="mx-auto flex max-w-[1440px] items-center px-4">
        {/* Fixed Left Status Badge */}
        <div className="mr-6 flex shrink-0 items-center gap-2 border-r border-[#252830] pr-6">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-[#00ca8e] transition-opacity duration-500 ${
                pulse ? "opacity-100 scale-125" : "opacity-40 scale-100"
              }`}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ca8e]" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[#b2b6bd]">
            Live Policy Gateway
          </span>
          <span className="rounded bg-[#00ca8e]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#00ca8e]">
            Arc Testnet
          </span>
        </div>

        {/* Ticker Items */}
        <div className="flex flex-1 items-center gap-8 overflow-hidden whitespace-nowrap mask-edges">
          <div className="flex shrink-0 animate-marquee items-center gap-8 text-[12px] font-mono">
            {INITIAL_STREAM.concat(INITIAL_STREAM).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center gap-3 rounded-md bg-[#15181e]/80 px-3 py-1 border border-[#252830]"
              >
                <span className="text-[#656a76]">{item.id}</span>
                <span className="font-semibold text-white">{item.agent}</span>
                <span className="text-[#b2b6bd]">·</span>
                <span className="text-[#b2b6bd]">{item.category}</span>
                <span className="font-semibold text-white">{item.amount}</span>
                <span
                  className={
                    item.status === "cleared"
                      ? "text-[#00ca8e] font-medium"
                      : "text-[#e62b1e] font-medium"
                  }
                >
                  {item.margin}
                </span>
                <span className="rounded bg-[#1f232b] px-1.5 py-0.5 text-[10px] text-[#b2b6bd]">
                  {item.latency}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    item.status === "cleared"
                      ? "bg-[#00ca8e]/10 text-[#00ca8e]"
                      : "bg-[#e62b1e]/10 text-[#e62b1e]"
                  }`}
                >
                  {item.status === "cleared" ? (
                    <>
                      <ShieldCheck size={10} />
                      CLEARED ({item.chain})
                    </>
                  ) : (
                    <>
                      <Zap size={10} />
                      CIRCUIT BLOCKED
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Right Metric */}
        <div className="ml-6 hidden shrink-0 items-center gap-3 border-l border-[#252830] pl-6 font-mono text-[11px] text-[#b2b6bd] lg:flex">
          <Activity size={13} className="text-[#14c6cb]" />
          <span>Avg Gate Latency:</span>
          <span className="font-semibold text-white">14.2ms</span>
        </div>
      </div>
    </div>
  );
}
