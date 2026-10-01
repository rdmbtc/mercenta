"use client";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  Cpu,
  Globe2,
  HardDrive,
  LayoutDashboard,
  Lock,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";

interface NodeItem {
  host: string;
  subdomain: string;
  role: string;
  status: "live" | "sandbox" | "planned";
  latency: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  accentColor: string;
  description: string;
}

const NODES: NodeItem[] = [
  {
    host: "mercenta.xyz",
    subdomain: "GATEWAY",
    role: "Flagship Public Gateway",
    status: "live",
    latency: "12ms",
    icon: Globe2,
    accentColor: "#14c6cb",
    description: "The cinematic gateway, policy philosophy, and public conversion portal.",
  },
  {
    subdomain: "CONSOLE",
    host: "/app",
    role: "Merchant & Agent Console",
    status: "sandbox",
    latency: "18ms",
    icon: LayoutDashboard,
    accentColor: "#7b42bc",
    description: "Operator cockpit for setting margin floors, spend ceilings, and reviewing held orders.",
  },
  {
    subdomain: "CATALOG",
    host: "/catalog",
    role: "Wholesale Inventory Registry",
    status: "sandbox",
    latency: "16ms",
    icon: Boxes,
    accentColor: "#1868f2",
    description: "Wholesale digital goods registry for autonomous machine consumption.",
  },
  {
    subdomain: "TESTNET",
    host: "testnet.mercenta.xyz",
    role: "Settlement Sandbox",
    status: "live",
    latency: "14ms",
    icon: Terminal,
    accentColor: "#00ca8e",
    description: "Live zero-risk sandbox for running autonomous agents with simulated USDC.",
  },
  {
    subdomain: "MAINNET",
    host: "mainnet.mercenta.xyz",
    role: "Live On-Chain Clearing",
    status: "planned",
    latency: "<25ms",
    icon: Cpu,
    accentColor: "#f24c53",
    description: "Production clearance environment on Arc, Base, and Solana.",
  },
  {
    subdomain: "DOCS",
    host: "docs.mercenta.xyz",
    role: "Mintlify Developer Hub",
    status: "sandbox",
    latency: "11ms",
    icon: BookOpen,
    accentColor: "#ffcf25",
    description: "Python and TypeScript SDK specifications, OpenAPI reference, and integration guides.",
  },
  {
    subdomain: "STATUS",
    host: "/status",
    role: "Gateway Health & Latency",
    status: "live",
    latency: "9ms",
    icon: Activity,
    accentColor: "#00ca8e",
    description: "Real-time uptime metrics, SLA monitors, and sub-25ms transaction health.",
  },
];

export default function EcosystemArchitecture() {
  return (
    <section
      id="ecosystem"
      className="relative z-10 py-24 md:py-32 bg-[#000000] text-white border-t border-[#15181e]"
      aria-labelledby="ecosystem-heading"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Eyebrow & Title */}
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.182em] text-[#7b42bc]">
            06 // ECOSYSTEM ARCHITECTURE
          </p>
          <h2
            id="ecosystem-heading"
            className="mt-3 font-serif text-[38px] sm:text-[56px] font-light leading-[1.0] tracking-[-1.5px] text-white"
          >
            Engineered across seven{" "}
            <span className="italic font-normal">dedicated infrastructure nodes.</span>
          </h2>
          <p className="mt-4 text-[16px] sm:text-[18px] font-light leading-[1.55] text-[#b2b6bd]">
            Built on the deterministic architecture architectural benchmark: strict hardware separation
            between the Agent SDK, Policy Gateway, Hardware Escrow, and Multi-chain USDC
            Settlement.
          </p>
        </div>

        {/* 7-Node Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isFeatured = i === 1 || i === 3;

            return (
              <a
                key={node.host}
                href={`https://${node.host}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative rounded-[20px] border p-6 transition-all duration-300 hover:translate-y-[-2px] ${
                  isFeatured
                    ? "border-[rgba(178,182,189,0.22)] bg-[#15181e] hover:border-white/40"
                    : "border-[#252830] bg-[#0c0e12] hover:border-[#3b3d45]"
                }`}
              >
                {/* Node Status & Subdomain Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: node.accentColor }}
                      className="h-2 w-2 rounded-full"
                    />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#656a76]">
                      {node.subdomain}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                      node.status === "live"
                        ? "bg-[#00ca8e]/10 text-[#00ca8e] border border-[#00ca8e]/20"
                        : node.status === "sandbox"
                        ? "bg-[#14c6cb]/10 text-[#14c6cb] border border-[#14c6cb]/20"
                        : "bg-[#252830] text-[#b2b6bd]"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                {/* Hostname and Role */}
                <div className="mt-5 flex items-start justify-between">
                  <div>
                    <h3 className="font-mono text-[16px] font-bold text-white group-hover:text-[#14c6cb] transition-colors">
                      {node.host}
                    </h3>
                    <p className="mt-1 font-sans text-[13px] font-semibold text-[#f5f5f7]">
                      {node.role}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#1f232b] p-2 text-[#b2b6bd] group-hover:text-white transition-colors">
                    <ArrowUpRight size={14} />
                  </span>
                </div>

                <p className="mt-3 text-[13px] font-sans leading-relaxed text-[#b2b6bd]">
                  {node.description}
                </p>

                {/* Latency Indicator */}
                <div className="mt-5 pt-3 border-t border-[#1c2027] flex items-center justify-between font-mono text-[11px] text-[#656a76]">
                  <span>Response Target:</span>
                  <span className="text-white font-medium">{node.latency}</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* deterministic architecture Architecture Assurance Statement */}
        <div className="mt-12 rounded-[16px] border border-[#252830] bg-[#0c0e12] p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-[12px]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7b42bc]/15 text-[#c490ff] border border-[#7b42bc]/30">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-white font-semibold text-[13px]">
                deterministic architecture Architecture Standard Compliance
              </p>
              <p className="text-[#b2b6bd] text-[12px] font-sans mt-0.5">
                Deterministic fees, hardware validation barriers, and verifiable receipts
                instead of model guesses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://docs.mercenta.xyz"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#3b3d45] px-4 py-2 text-white hover:bg-[#15181e] transition-colors"
            >
              Inspect Architecture Blueprint
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
