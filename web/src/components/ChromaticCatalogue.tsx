"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Cpu, Gamepad2, Globe2, HeartHandshake, Tv, X } from "lucide-react";

interface CategoryTile {
  id: string;
  name: string;
  skuPrefix: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  tagline: string;
  description: string;
  margin: string;
  deliveryLatency: string;
  platforms: string[];
  sampleItem: {
    sku: string;
    item: string;
    wholesale: string;
    retail: string;
    format: string;
  };
}

const CATEGORIES: CategoryTile[] = [
  {
    id: "gaming",
    name: "Gaming Keys & Platform Vouchers",
    skuPrefix: "MR-GMG-ST01",
    bgColor: "#1868f2", // Vagrant Blue
    textColor: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.20)",
    badgeText: "#ffffff",
    icon: Gamepad2,
    tagline: "Instant machine-to-machine key provisioning",
    description:
      "Activation keys and balance vouchers across Steam, PlayStation, Xbox, Epic Games, Riot, and Blizzard. High-throughput redemption with zero inventory holding cost.",
    margin: "14.5%",
    deliveryLatency: "<35ms",
    platforms: ["Steam", "PlayStation Network", "Xbox Live", "Epic Games", "Riot", "Blizzard Battle.net"],
    sampleItem: {
      sku: "MR-GMG-STM-50",
      item: "Steam $50 USD Wallet Card Key",
      wholesale: "$42.75 USDC",
      retail: "$50.00 USDC",
      format: "Instant 25-character alphanum activation token",
    },
  },
  {
    id: "streaming",
    name: "Streaming & Media Subscriptions",
    skuPrefix: "MR-STM-PREM",
    bgColor: "#7b42bc", // Terraform Purple
    textColor: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.20)",
    badgeText: "#ffffff",
    icon: Tv,
    tagline: "Programmatic automated recurring renewals",
    description:
      "Automated subscription provisioning for premium video, audio, and content services. Agents renew licenses on strict autonomous intervals under budget caps.",
    margin: "18.0%",
    deliveryLatency: "<40ms",
    platforms: ["Spotify Premium", "Netflix UHD", "YouTube Premium", "Disney+", "Apple Music"],
    sampleItem: {
      sku: "MR-STM-SPO-3M",
      item: "Spotify Premium 3-Month Voucher",
      wholesale: "$24.60 USDC",
      retail: "$29.99 USDC",
      format: "Digital redemption code + account sync hook",
    },
  },
  {
    id: "micro-donations",
    name: "Creator & Game Micro-Donations",
    skuPrefix: "MR-DON-INST",
    bgColor: "#14c6cb", // Waypoint Cyan
    textColor: "#000000",
    badgeBg: "rgba(0, 0, 0, 0.15)",
    badgeText: "#000000",
    icon: HeartHandshake,
    tagline: "Bounded high-frequency agent micropayments",
    description:
      "Real-time micro-payments into live stream overlays, in-game tips, and creator ecosystems. Strictly capped per agent session to avoid unbounded gratuity loops.",
    margin: "12.0%",
    deliveryLatency: "<18ms",
    platforms: ["Twitch Bits", "Kick Subs", "Discord Nitro", "In-game Tip Jars"],
    sampleItem: {
      sku: "MR-DON-TCH-1K",
      item: "Twitch 1,000 Bits Stream Injection",
      wholesale: "$8.80 USDC",
      retail: "$10.00 USDC",
      format: "Direct websocket broadcast webhook + receipt",
    },
  },
  {
    id: "api-tokens",
    name: "Developer API & Token Bundles",
    skuPrefix: "MR-API-1000",
    bgColor: "#ffcf25", // Vault Yellow
    textColor: "#000000",
    badgeBg: "rgba(0, 0, 0, 0.15)",
    badgeText: "#000000",
    icon: Globe2,
    tagline: "Institutional bulk LLM compute credit pools",
    description:
      "Wholesale volume credit pools for frontier AI models. AI agents top up their own inference budgets at wholesale discount rates rather than retail API pricing.",
    margin: "16.0%",
    deliveryLatency: "<25ms",
    platforms: ["Anthropic Claude", "OpenAI", "DeepSeek", "Together AI", "Groq"],
    sampleItem: {
      sku: "MR-API-ANT-10M",
      item: "10,000,000 Frontier Model Token Credits",
      wholesale: "$714.00 USDC",
      retail: "$850.00 USDC",
      format: "Dedicated API key provisioned in hardware vault",
    },
  },
  {
    id: "cloud-compute",
    name: "Cloud Compute & GPU Vouchers",
    skuPrefix: "MR-CMP-H100",
    bgColor: "#00ca8e", // Nomad Green
    textColor: "#000000",
    badgeBg: "rgba(0, 0, 0, 0.15)",
    badgeText: "#000000",
    icon: Cpu,
    tagline: "Dedicated H100/A100 high-performance compute",
    description:
      "On-demand reservation of bare-metal H100 and A100 GPU clusters priced per compute hour. Agents dynamically spin up clusters and pay per execution window in USDC.",
    margin: "19.2%",
    deliveryLatency: "<50ms",
    platforms: ["NVIDIA H100 SXM5", "NVIDIA A100 80GB", "L40S Clusters", "High-Bandwidth RDMA"],
    sampleItem: {
      sku: "MR-CMP-H100-250H",
      item: "250 Compute Hours NVIDIA H100 Cluster",
      wholesale: "$1,147.00 USDC",
      retail: "$1,420.00 USDC",
      format: "SSH Cluster Key + SLURM Enclave Credentials",
    },
  },
];

export default function ChromaticCatalogue() {
  const [activeItem, setActiveItem] = useState<CategoryTile | null>(null);

  return (
    <section
      id="catalogue"
      className="relative z-10 py-24 md:py-32 bg-[#000000] text-white border-t border-[#15181e]"
      aria-labelledby="catalogue-heading"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Eyebrow & Headline */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.182em] text-[#1868f2]">
              04 // WHOLESALE COMMERCE RAILS
            </p>
            <h2
              id="catalogue-heading"
              className="mt-3 font-serif text-[38px] sm:text-[56px] font-light leading-[1.0] tracking-[-1.5px] text-white"
            >
              Five institutional product families.{" "}
              <span className="italic font-normal">Delivered machine-to-machine.</span>
            </h2>
            <p className="mt-4 text-[16px] sm:text-[18px] font-light leading-[1.55] text-[#b2b6bd]">
              Digital inventory optimized for autonomous agent procurement. Instant API
              fulfillment, guaranteed gross margins, and zero supplier disclosure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
            >
              Explore Full Catalog API
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        {/* 5 Signature Chromatic Tiles (DESIGN.md Section 5.3) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, index) => {
            const Icon = cat.icon;
            const isFullSpan = index === 3 || index === 4;

            return (
              <div
                key={cat.id}
                onClick={() => setActiveItem(cat)}
                style={{
                  backgroundColor: cat.bgColor,
                  color: cat.textColor,
                }}
                className={`group cursor-pointer rounded-[30px] p-8 transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between ${
                  isFullSpan && index === 3 ? "lg:col-span-1" : ""
                } ${isFullSpan && index === 4 ? "lg:col-span-2" : ""}`}
              >
                <div>
                  {/* Top Bar with Icon & SKU Code */}
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        backgroundColor: cat.badgeBg,
                        color: cat.badgeText,
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                    >
                      <Icon size={20} />
                    </span>
                    <span
                      style={{
                        backgroundColor: cat.badgeBg,
                        color: cat.badgeText,
                      }}
                      className="rounded-full px-3 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase"
                    >
                      {cat.skuPrefix}
                    </span>
                  </div>

                  {/* Title and Tagline */}
                  <h3 className="mt-6 font-serif text-[30px] sm:text-[34px] font-light leading-[1.05]">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-[14px] font-mono opacity-85">
                    {cat.tagline}
                  </p>

                  <p className="mt-4 text-[14px] font-sans leading-relaxed opacity-90 line-clamp-3">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom Row Metrics */}
                <div className="mt-8 pt-5 border-t border-black/15 flex items-center justify-between text-[12px] font-mono">
                  <div>
                    <span className="opacity-75 block text-[10px] uppercase">
                      Guaranteed Margin
                    </span>
                    <span className="font-bold text-[16px]">{cat.margin}</span>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px] uppercase">
                      Avg Delivery
                    </span>
                    <span className="font-semibold">{cat.deliveryLatency}</span>
                  </div>
                  <div className="flex items-center gap-1 font-sans font-semibold group-hover:underline">
                    <span>Inspect Spec</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Drawer for Inspecting Product Spec */}
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-xl rounded-[24px] border border-[#3b3d45] bg-[#15181e] p-6 sm:p-8 text-white shadow-2xl">
              <button
                onClick={() => setActiveItem(null)}
                className="absolute right-5 top-5 rounded-full p-2 text-[#b2b6bd] hover:bg-[#1f232b] hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <span
                  style={{ backgroundColor: activeItem.bgColor }}
                  className="h-3 w-3 rounded-full"
                />
                <span className="font-mono text-[12px] uppercase text-[#b2b6bd]">
                  SPECIFICATION // {activeItem.skuPrefix}
                </span>
              </div>

              <h3 className="mt-3 font-serif text-[28px] font-light text-white">
                {activeItem.name}
              </h3>
              <p className="mt-2 text-[14px] text-[#b2b6bd]">
                {activeItem.description}
              </p>

              {/* Supported Platforms */}
              <div className="mt-6">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-[#656a76]">
                  Institutional Coverage & Networks:
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeItem.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded bg-[#1f232b] px-2.5 py-1 text-[12px] font-mono text-[#b2b6bd] border border-[#252830]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Order Specification Box */}
              <div className="mt-6 rounded-[12px] bg-[#0c0e12] p-4 border border-[#252830] font-mono text-[12px]">
                <div className="flex items-center justify-between text-[#656a76] pb-2 border-b border-[#1c2027]">
                  <span>SAMPLE_ITEM_QUOTE</span>
                  <span className="text-[#00ca8e]">MARGIN: {activeItem.margin}</span>
                </div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#656a76]">Item Name:</span>
                    <span className="text-white font-medium">{activeItem.sampleItem.item}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656a76]">Wholesale Supplier Rate:</span>
                    <span className="text-white font-semibold">{activeItem.sampleItem.wholesale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656a76]">Retail Client Charge:</span>
                    <span className="text-white font-semibold">{activeItem.sampleItem.retail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656a76]">Delivery Format:</span>
                    <span className="text-[#14c6cb]">{activeItem.sampleItem.format}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#252830]">
                <button
                  onClick={() => setActiveItem(null)}
                  className="rounded-[8px] bg-[#1f232b] px-4 py-2 text-[13px] font-medium text-[#b2b6bd] hover:text-white"
                >
                  Close
                </button>
                <a
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-white px-4 py-2 text-[13px] font-semibold text-black hover:bg-white/90"
                >
                  View in Catalog Console
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
