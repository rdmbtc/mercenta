"use client";

import { useState } from "react";
import { ArrowRight, FileCode2, Fingerprint, Lock, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";

interface AgentScenario {
  id: string;
  name: string;
  role: string;
  intent: string;
  sku: string;
  customerAmount: number;
  supplierCost: number;
  supplierVerified: boolean;
  notes: string;
}

const SCENARIOS: AgentScenario[] = [
  {
    id: "devin",
    name: "Devin 2.0",
    role: "Autonomous SWE",
    intent: "Reserve 10x H100 GPU Cluster (4h)",
    sku: "MR-CMP-H100",
    customerAmount: 1420.0,
    supplierCost: 1147.0,
    supplierVerified: true,
    notes: "High-demand compute slice; instant voucher provision.",
  },
  {
    id: "claude",
    name: "Claude 3.7 Sonnet",
    role: "Financial Analyst Agent",
    intent: "Developer API Bulk Token Pool",
    sku: "MR-API-1000",
    customerAmount: 850.0,
    supplierCost: 714.0,
    supplierVerified: true,
    notes: "Direct model credit reservation at wholesale tier.",
  },
  {
    id: "openclaw",
    name: "OpenClaw Worker",
    role: "Procurement Bot",
    intent: "Gaming Keys & Platform Vouchers",
    sku: "MR-GMG-ST01",
    customerAmount: 240.0,
    supplierCost: 205.0,
    supplierVerified: true,
    notes: "Instant redemption code with verifiable cryptographic receipt.",
  },
  {
    id: "rogue",
    name: "Rogue Subagent",
    role: "Unbounded Loop Bot",
    intent: "Unverified Supplier Arbitrage Spend",
    sku: "UNKNOWN-EXT-88",
    customerAmount: 14500.0,
    supplierCost: 14100.0,
    supplierVerified: false,
    notes: "Attempts $14.5k spend on unverified rails with razor 2.7% margin.",
  },
];

export default function HeroSection() {
  const [selectedId, setSelectedId] = useState<string>("devin");
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  // Deterministic evaluation parameters
  const MARGIN_FLOOR = 0.12; // 12%
  const APPROVAL_LIMIT = 2000.0; // $2,000 max auto-approval
  const AVAILABLE_BALANCE = 50000.0;
  const RESERVED_LIQUIDITY = 12400.0;

  const freeToSpend = AVAILABLE_BALANCE - RESERVED_LIQUIDITY;
  const margin =
    scenario.customerAmount > 0
      ? (scenario.customerAmount - scenario.supplierCost) / scenario.customerAmount
      : 0;
  const marginPct = (margin * 100).toFixed(1);

  // Gates
  const gate1Pass = scenario.customerAmount <= AVAILABLE_BALANCE;
  const gate2Pass = scenario.supplierCost <= freeToSpend;
  const gate3Pass = margin >= MARGIN_FLOOR;
  const gate4Pass = scenario.supplierVerified;
  const gate5State =
    scenario.customerAmount <= APPROVAL_LIMIT
      ? "pass"
      : "hold"; // hold for human

  const isBlocked = !gate1Pass || !gate2Pass || !gate3Pass || !gate4Pass;
  const isHeld = !isBlocked && gate5State === "hold";
  const isCleared = !isBlocked && !isHeld;

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 450);
  };

  const receiptHash = `0x7f4c9a81e3d09b62f849b291a${scenario.sku.replace(
    /[^a-z0-9]/gi,
    ""
  )}e0481c7`;

  const copyHash = () => {
    navigator.clipboard.writeText(receiptHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-black text-white">
      {/* Subtle deep vault horizon background gradient (DESIGN.md Section 6) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(180deg, #000000 0%, #090a0d 45%, #101a59 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Header Eyebrow & Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.182em] uppercase text-[#f5f5f7]">
            <Terminal size={12} className="text-[#14c6cb]" />
            00 // AUTONOMOUS COMMERCE OPERATING SYSTEM
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7b42bc]/30 bg-[#7b42bc]/10 px-3 py-1 font-mono text-[11px] font-medium text-[#c490ff]">
            <Lock size={11} />
            deterministic architecture DETERMINISTIC ENCLAVE
          </span>
        </div>

        {/* Flagship Editorial Headline (DESIGN.md Section 3: DM Serif Display @ 300) */}
        <div className="max-w-4xl">
          <h1 className="font-serif text-[48px] sm:text-[68px] lg:text-[88px] font-light leading-[0.92] tracking-[-2.5px] text-white">
            Autonomous agents require{" "}
            <span className="italic font-normal text-white">
              mathematical restraint.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-[17px] sm:text-[19px] font-light leading-[1.5] text-[#b2b6bd]">
            Mercenta sits as an unbypassable policy gateway between AI agents and
            real funds. Five deterministic gates evaluate every procurement intent
            in <span className="font-mono text-white font-medium">&lt;18ms</span>{" "}
            before any capital moves. Zero hallucinations. Guaranteed margin
            floors. Instant USDC clearing on Arc, Base, and Solana.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="https://testnet.mercenta.xyz"
              className="inline-flex items-center gap-2 rounded-[8px] bg-white px-5 py-3 text-[14px] font-semibold text-black style-black transition-all hover:bg-white/90 hover:translate-y-[-1px] active:translate-y-0"
            >
              Enter Testnet Sandbox
              <ArrowRight size={16} />
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.14)] bg-white/[0.08] backdrop-blur-md px-5 py-3 text-[14px] font-semibold text-white transition-all hover:bg-white/[0.14] hover:border-white/30"
            >
              Launch Operator App
            </a>
            <a
              href="https://docs.mercenta.xyz"
              className="inline-flex items-center gap-2 rounded-[8px] border border-[#3b3d45] px-4 py-3 text-[14px] font-medium text-[#b2b6bd] transition-colors hover:text-white hover:border-[#656a76]"
            >
              <FileCode2 size={16} />
              Developer Docs
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE HERO HARDWARE TERMINAL: LIVE POLICY ENCLAVE SIMULATOR           */}
        {/* ========================================================================= */}
        <div className="mt-16 rounded-[24px] border border-[rgba(178,182,189,0.16)] bg-[#101318]/95 p-2 backdrop-blur-2xl shadow-2xl">
          {/* Top Bar of the Machined Hardware Container */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#252830] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b3d45]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b3d45]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b3d45]" />
              <span className="ml-3 font-mono text-[12px] tracking-wider text-[#b2b6bd]">
                MERCENTA-GATEWAY // ENCLAVE-PROT-v2.6 // ARC-SECP256k1
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-[#00ca8e]/10 px-2 py-0.5 font-mono text-[11px] text-[#00ca8e]">
                Deterministic Engine: ACTIVE
              </span>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#1f232b] px-3 py-1 font-mono text-[11px] font-semibold text-white transition-colors hover:bg-[#2b303c]"
              >
                {isSimulating ? (
                  <RotateCcw size={12} className="animate-spin text-[#14c6cb]" />
                ) : (
                  <Play size={12} className="text-[#00ca8e]" />
                )}
                Run Clearance Check
              </button>
            </div>
          </div>

          {/* Dual-Pane Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#252830]">
            {/* Left Pane: Agent Intent Dispatcher (5 cols) */}
            <div className="p-5 lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#656a76]">
                  01 // SELECT AUTONOMOUS AGENT INTENT
                </p>

                {/* Scenario Switcher */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SCENARIOS.map((s) => {
                    const isSelected = s.id === selectedId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={`text-left p-2.5 rounded-[8px] border transition-all ${
                          isSelected
                            ? "border-[#14c6cb] bg-[#14c6cb]/10 text-white"
                            : "border-[#252830] bg-[#15181e] text-[#b2b6bd] hover:border-[#3b3d45]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-semibold text-[13px]">
                            {s.name}
                          </span>
                          {s.id === "rogue" && (
                            <span className="text-[10px] font-mono text-[#e62b1e] bg-[#e62b1e]/10 px-1 rounded">
                              RISK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[#656a76] truncate">
                          {s.role}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* JSON Intent Payload Box */}
                <div className="mt-4 rounded-[10px] bg-[#090b0e] p-3.5 border border-[#252830] font-mono text-[12px]">
                  <div className="flex items-center justify-between text-[#656a76] pb-2 border-b border-[#1c2027]">
                    <span>INTENT_PAYLOAD.json</span>
                    <span className="text-[#00ca8e]">SIG: ED25519_OK</span>
                  </div>
                  <pre className="mt-2 text-[#b2b6bd] text-[11px] overflow-x-auto leading-relaxed">
{`{
  "agent_id": "${scenario.id}",
  "sku": "${scenario.sku}",
  "intent": "${scenario.intent}",
  "amount_usdc": ${scenario.customerAmount.toFixed(2)},
  "supplier_cost": ${scenario.supplierCost.toFixed(2)},
  "margin_calc": "${marginPct}%",
  "supplier_verified": ${scenario.supplierVerified}
}`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1c2027] text-[12px] text-[#656a76] flex items-center justify-between">
                <span>Wholesale catalog rate applied</span>
                <span className="font-mono text-[#b2b6bd]">{scenario.notes}</span>
              </div>
            </div>

            {/* Right Pane: 5-Gate Deterministic Evaluation Matrix (7 cols) */}
            <div className="p-5 lg:col-span-7 bg-[#0b0e12]/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#656a76]">
                    02 // DETERMINISTIC EVALUATION (0 TOKENS USED)
                  </p>
                  <span className="font-mono text-[11px] text-[#14c6cb]">
                    Latency: 14.8ms
                  </span>
                </div>

                {/* The 5 Gates List */}
                <div className="mt-3 space-y-2">
                  {/* Gate 1 */}
                  <div
                    className={`flex items-center justify-between rounded-[8px] p-2.5 border transition-all ${
                      gate1Pass
                        ? "border-[#252830] bg-[#15181e]"
                        : "border-[#e62b1e]/50 bg-[#e62b1e]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate1Pass ? "bg-[#00ca8e]" : "bg-[#e62b1e]"
                        }`}
                      />
                      <span className="font-mono text-[12px] text-white">
                        Gate 1 // Available Balance
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#b2b6bd]">
                      ${scenario.customerAmount.toLocaleString()} ≤ $
                      {AVAILABLE_BALANCE.toLocaleString()}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        gate1Pass ? "text-[#00ca8e]" : "text-[#e62b1e]"
                      }`}
                    >
                      {gate1Pass ? "PASS" : "FAIL"}
                    </span>
                  </div>

                  {/* Gate 2 */}
                  <div
                    className={`flex items-center justify-between rounded-[8px] p-2.5 border transition-all ${
                      gate2Pass
                        ? "border-[#252830] bg-[#15181e]"
                        : "border-[#e62b1e]/50 bg-[#e62b1e]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate2Pass ? "bg-[#00ca8e]" : "bg-[#e62b1e]"
                        }`}
                      />
                      <span className="font-mono text-[12px] text-white">
                        Gate 2 // Reserved Liquidity Lock
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#b2b6bd]">
                      ${scenario.supplierCost.toLocaleString()} held in escrow
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        gate2Pass ? "text-[#00ca8e]" : "text-[#e62b1e]"
                      }`}
                    >
                      {gate2Pass ? "PASS" : "FAIL"}
                    </span>
                  </div>

                  {/* Gate 3 */}
                  <div
                    className={`flex items-center justify-between rounded-[8px] p-2.5 border transition-all ${
                      gate3Pass
                        ? "border-[#252830] bg-[#15181e]"
                        : "border-[#e62b1e]/50 bg-[#e62b1e]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate3Pass ? "bg-[#00ca8e]" : "bg-[#e62b1e]"
                        }`}
                      />
                      <span className="font-mono text-[12px] text-white">
                        Gate 3 // Gross Margin Floor (≥12%)
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] ${
                        gate3Pass ? "text-[#00ca8e]" : "text-[#e62b1e]"
                      }`}
                    >
                      Actual: {marginPct}% vs Floor: 12.0%
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        gate3Pass ? "text-[#00ca8e]" : "text-[#e62b1e]"
                      }`}
                    >
                      {gate3Pass ? "PASS" : "BLOCKED"}
                    </span>
                  </div>

                  {/* Gate 4 */}
                  <div
                    className={`flex items-center justify-between rounded-[8px] p-2.5 border transition-all ${
                      gate4Pass
                        ? "border-[#252830] bg-[#15181e]"
                        : "border-[#e62b1e]/50 bg-[#e62b1e]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate4Pass ? "bg-[#00ca8e]" : "bg-[#e62b1e]"
                        }`}
                      />
                      <span className="font-mono text-[12px] text-white">
                        Gate 4 // Whitelisted Supplier Rail
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#b2b6bd]">
                      {gate4Pass ? "Institutional Verified" : "Unverified / Unknown"}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        gate4Pass ? "text-[#00ca8e]" : "text-[#e62b1e]"
                      }`}
                    >
                      {gate4Pass ? "PASS" : "BLOCKED"}
                    </span>
                  </div>

                  {/* Gate 5 */}
                  <div
                    className={`flex items-center justify-between rounded-[8px] p-2.5 border transition-all ${
                      gate5State === "pass"
                        ? "border-[#252830] bg-[#15181e]"
                        : "border-[#ffcf25]/50 bg-[#ffcf25]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate5State === "pass" ? "bg-[#00ca8e]" : "bg-[#ffcf25]"
                        }`}
                      />
                      <span className="font-mono text-[12px] text-white">
                        Gate 5 // Auto-Approval Limit (≤$2,000)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#b2b6bd]">
                      Limit: $2,000.00
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        gate5State === "pass" ? "text-[#00ca8e]" : "text-[#ffcf25]"
                      }`}
                    >
                      {gate5State === "pass" ? "PASS" : "HOLD (HUMAN)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Verdict Banner & Receipt Proof */}
              <div className="mt-5 rounded-[12px] border border-[#252830] bg-[#15181e] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCleared && (
                      <ShieldCheck size={18} className="text-[#00ca8e]" />
                    )}
                    {isBlocked && (
                      <ShieldAlert size={18} className="text-[#e62b1e]" />
                    )}
                    {isHeld && <Lock size={18} className="text-[#ffcf25]" />}

                    <span
                      className={`font-mono text-[13px] font-bold tracking-wide uppercase ${
                        isCleared
                          ? "text-[#00ca8e]"
                          : isBlocked
                          ? "text-[#e62b1e]"
                          : "text-[#ffcf25]"
                      }`}
                    >
                      {isCleared && "INTENT CLEARED // INSTANT USDC SETTLEMENT"}
                      {isBlocked && "POLICY CIRCUIT BREAKER TRIPPED // BLOCKED"}
                      {isHeld && "DUAL-KEY HUMAN APPROVAL REQUIRED"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#656a76]">
                    Arc Block #4819024
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[#252830] pt-2 text-[11px] font-mono text-[#b2b6bd]">
                  <span className="flex items-center gap-1.5 text-[#656a76]">
                    <Fingerprint size={12} />
                    Receipt Hash:
                    <span className="text-[#b2b6bd]">{receiptHash.slice(0, 18)}...</span>
                  </span>
                  <button
                    onClick={copyHash}
                    className="text-[#14c6cb] hover:underline"
                  >
                    {copiedHash ? "Copied!" : "Copy Cryptographic Receipt"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
